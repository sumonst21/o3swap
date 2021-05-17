import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import {
  O3_TOKEN,
  Token,
  UPDATE_VAULT_STAKE_PENDING_TX,
  O3STAKING_CONTRACT,
  O3TOKEN_CONTRACT,
  ETH_AIRDROP_CLAIM_CONTRACT,
} from '@lib';
import { Store } from '@ngrx/store';
import { interval, Observable, of, Unsubscribable } from 'rxjs';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import Web3 from 'web3';
import {
  VaultTransaction,
  VaultTransactionType,
  VaultWallet,
} from 'src/app/_lib/vault';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { RpcApiService } from '@core/api/rpc.service';
import BalanceTree from '../markle/balance-tree';
import { VaultdMetaMaskWalletApiService } from './vault-metamask';
import { EthApiService } from './eth.service';
interface State {
  vault: any;
}
@Injectable()
export class VaultEthWalletApiService {
  private requestTxStatusInterval: Unsubscribable;
  private web3: Web3 = new Web3();
  private contractJson = {};

  private vault$: Observable<any>;
  private vaultWallet: VaultWallet;
  private vaultTransaction: VaultTransaction;

  constructor(
    private http: HttpClient,
    private store: Store<State>,
    private swapService: SwapService,
    private commonService: CommonService,
    private rpcApiService: RpcApiService,
    private vaultdMetaMaskWalletApiService: VaultdMetaMaskWalletApiService,
    private ethApiService: EthApiService
  ) {
    this.vault$ = store.select('vault');
    this.vault$.subscribe((state) => {
      this.vaultWallet = state.vaultWallet;
      this.vaultTransaction = state.vaultTransaction;
    });
  }

  //#region connect
  initTx(): void {
    const localTxString = localStorage.getItem('vaultTransaction');
    if (localTxString === null || localTxString === undefined) {
      return;
    }
    const localTx: VaultTransaction = JSON.parse(localTxString);
    if (localTx.fromToken.chain === 'NEO') {
      return;
    }
    this.vaultTransaction = localTx;
    this.store.dispatch({ type: UPDATE_VAULT_STAKE_PENDING_TX, data: localTx });
    if (localTx.isPending === false) {
      return;
    }
    this.listenTxReceipt(localTx.txid, UPDATE_VAULT_STAKE_PENDING_TX);
  }
  //#endregion

  checkNetwork(fromToken: Token): boolean {
    return this.vaultdMetaMaskWalletApiService.checkNetwork(fromToken);
  }

  getContractJson(
    type: 'o3Json' | 'o3Staking' | 'airdrop' | 'airdropList'
  ): Promise<any> {
    if (this.contractJson[type]) {
      return of(this.contractJson[type]).toPromise();
    }
    let path: string;
    switch (type) {
      case 'o3Json':
        path = 'assets/contracts-json/O3.json';
        break;
      case 'o3Staking':
        path = 'assets/contracts-json/O3Staking.json';
        break;
      case 'airdrop':
        path = 'assets/contracts-json/Airdrop.json';
        break;
      case 'airdropList':
        path = 'assets/datas/airdropList.json';
        break;
    }
    return this.http
      .get(path)
      .pipe(
        map((res) => {
          this.contractJson[type] = res;
          return res;
        })
      )
      .toPromise();
  }

  //#region vault staking
  async o3StakingStake(
    token: Token,
    inputAmount: string,
    address?: string
  ): Promise<any> {
    const json = await this.getContractJson('o3Staking');
    const o3StakingContractHash = O3STAKING_CONTRACT[token.assetID];
    const o3StakingContract = new this.web3.eth.Contract(
      json,
      o3StakingContractHash
    );
    const data = o3StakingContract.methods
      .stake(
        new BigNumber(inputAmount).shiftedBy(token.decimals).dp(0).toFixed()
      )
      .encodeABI();
    const requestData = {
      method: 'eth_sendTransaction',
      params: [
        this.swapService.getSendTransactionParams(
          address || this.vaultWallet.address,
          o3StakingContractHash,
          data
        ),
      ],
    };
    if (
      (await this.ethApiService.getPreExecutionResult(
        requestData.params,
        token
      )) !== true
    ) {
      return;
    }
    return this.vaultdMetaMaskWalletApiService
      .sendTransaction(requestData, token.chain)
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, VaultTransactionType.stake);
        return hash;
      });
  }
  async o3StakingUnStake(token: Token, inputAmount: string): Promise<any> {
    const json = await this.getContractJson('o3Staking');
    const o3StakingContractHash = O3STAKING_CONTRACT[token.assetID];
    const o3StakingContract = new this.web3.eth.Contract(
      json,
      o3StakingContractHash
    );
    const data = o3StakingContract.methods
      .unstake(
        new BigNumber(inputAmount).shiftedBy(token.decimals).dp(0).toFixed()
      )
      .encodeABI();
    const requestData = {
      method: 'eth_sendTransaction',
      params: [
        this.swapService.getSendTransactionParams(
          this.vaultWallet.address,
          o3StakingContractHash,
          data
        ),
      ],
    };
    if (
      (await this.ethApiService.getPreExecutionResult(
        requestData.params,
        token
      )) !== true
    ) {
      return;
    }
    return this.vaultdMetaMaskWalletApiService
      .sendTransaction(requestData, token.chain)
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, VaultTransactionType.unstake);
        return hash;
      });
  }
  async o3StakingClaimProfit(
    token: Token,
    profit: string,
    address?: string
  ): Promise<any> {
    const json = await this.getContractJson('o3Staking');
    const o3StakingContractHash = O3STAKING_CONTRACT[token.assetID];
    const o3StakingContract = new this.web3.eth.Contract(
      json,
      o3StakingContractHash
    );
    const data = o3StakingContract.methods.claimProfit().encodeABI();
    const requestData = {
      method: 'eth_sendTransaction',
      params: [
        this.swapService.getSendTransactionParams(
          address || this.vaultWallet.address,
          o3StakingContractHash,
          data
        ),
      ],
    };
    if (
      (await this.ethApiService.getPreExecutionResult(
        requestData.params,
        token
      )) !== true
    ) {
      return;
    }
    return this.vaultdMetaMaskWalletApiService
      .sendTransaction(requestData, token.chain)
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(O3_TOKEN, profit, hash, VaultTransactionType.claim);
        return hash;
      });
  }
  async getO3StakingTotalStaing(token: Token): Promise<string> {
    let params;
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    const json = await this.getContractJson('o3Staking');
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods.totalStaked().encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        this.vaultWallet?.address || contractHash,
        contractHash,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  async getO3StakingSharePerBlock(token: Token): Promise<string> {
    let params;
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    const json = await this.getContractJson('o3Staking');
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods.getSharePerBlock().encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        this.vaultWallet?.address || contractHash,
        contractHash,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  async getO3StakingTotalProfit(
    token: Token,
    address?: string
  ): Promise<string> {
    if (!this.vaultWallet && !address) {
      return;
    }
    let params;
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    const json = await this.getContractJson('o3Staking');
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods
      .getTotalProfit(address || this.vaultWallet.address)
      .encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        address || this.vaultWallet.address,
        contractHash,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  async getO3StakingStaked(token: Token, address?: string): Promise<string> {
    if (!this.vaultWallet && !address) {
      return;
    }
    let params;
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    const json = await this.getContractJson('o3Staking');
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods
      .getStakingAmount(address || this.vaultWallet.address)
      .encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        address || this.vaultWallet.address,
        contractHash,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  //#endregion

  //#region vault o3
  async stakeO3(token: Token, inputAmount: string): Promise<any> {
    const json = await this.getContractJson('o3Json');
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = o3Contract.methods
      .stake(
        token.assetID,
        new BigNumber(inputAmount).shiftedBy(token.decimals).dp(0).toFixed()
      )
      .encodeABI();
    const requestData = {
      method: 'eth_sendTransaction',
      params: [
        this.swapService.getSendTransactionParams(
          this.vaultWallet.address,
          O3TOKEN_CONTRACT,
          data
        ),
      ],
    };
    if (
      (await this.ethApiService.getPreExecutionResult(
        requestData.params,
        token
      )) !== true
    ) {
      return;
    }
    return this.vaultdMetaMaskWalletApiService
      .sendTransaction(requestData, token.chain)
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, VaultTransactionType.stake);
        return hash;
      });
  }
  async unstakeO3(token: Token, inputAmount: string): Promise<any> {
    const json = await this.getContractJson('o3Json');
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = o3Contract.methods
      .unstake(
        token.assetID,
        new BigNumber(inputAmount).shiftedBy(token.decimals).dp(0).toFixed()
      )
      .encodeABI();
    const requestData = {
      method: 'eth_sendTransaction',
      params: [
        this.swapService.getSendTransactionParams(
          this.vaultWallet.address,
          O3TOKEN_CONTRACT,
          data
        ),
      ],
    };
    if (
      (await this.ethApiService.getPreExecutionResult(
        requestData.params,
        token
      )) !== true
    ) {
      return;
    }
    return this.vaultdMetaMaskWalletApiService
      .sendTransaction(requestData, token.chain)
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, VaultTransactionType.unstake);
        return hash;
      });
  }
  async claimUnlocked(token: Token, unlocked: string): Promise<any> {
    const json = await this.getContractJson('o3Json');
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = o3Contract.methods.claimUnlocked(token.assetID).encodeABI();
    const requestData = {
      method: 'eth_sendTransaction',
      params: [
        this.swapService.getSendTransactionParams(
          this.vaultWallet.address,
          O3TOKEN_CONTRACT,
          data
        ),
      ],
    };
    if (
      (await this.ethApiService.getPreExecutionResult(
        requestData.params,
        token
      )) !== true
    ) {
      return;
    }
    return this.vaultdMetaMaskWalletApiService
      .sendTransaction(requestData, token.chain)
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(O3_TOKEN, unlocked, hash, VaultTransactionType.claim);
        return hash;
      });
  }
  async getUnlockedOf(): Promise<string> {
    const token = O3_TOKEN;
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getContractJson('o3Json');
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods
      .unlockedOf(this.vaultWallet.address)
      .encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        this.vaultWallet.address,
        O3TOKEN_CONTRACT,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  async getLockedOf(): Promise<string> {
    const token = O3_TOKEN;
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getContractJson('o3Json');
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods
      .lockedOf(this.vaultWallet.address)
      .encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        this.vaultWallet.address,
        O3TOKEN_CONTRACT,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  async getStaked(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getContractJson('o3Json');
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods.getStaked(token.assetID).encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        this.vaultWallet.address,
        O3TOKEN_CONTRACT,
        data
      ),
      'latest',
    ];
    return this.rpcApiService
      .getEthCall(params, token)
      .then((res) => {
        if (res) {
          return res;
        }
      })
      .catch(() => {});
  }
  async getUnlockSpeed(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getContractJson('o3Json');
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods
      .getUnlockSpeed(this.vaultWallet.address, token.assetID)
      .encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        this.vaultWallet.address,
        O3TOKEN_CONTRACT,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return new BigNumber(res).div(new BigNumber('100000000')).toFixed();
      }
    });
  }
  async claimableUnlocked(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getContractJson('o3Json');
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods
      .claimableUnlocked(token.assetID)
      .encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        this.vaultWallet.address,
        O3TOKEN_CONTRACT,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }

  async isAirdropClaimed(index: number): Promise<boolean> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const constractHash = ETH_AIRDROP_CLAIM_CONTRACT;
    const json = await this.getContractJson('airdrop');
    const o3Contract = new this.web3.eth.Contract(json, constractHash);
    const data = await o3Contract.methods.isClaimed(index).encodeABI();
    params = [
      this.swapService.getSendTransactionParams(
        this.vaultWallet.address,
        constractHash,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, O3_TOKEN, true).then((res) => {
      if (new BigNumber(res).comparedTo(0) === 0) {
        return false;
      } else {
        return true;
      }
    });
  }

  async claimAirdrop(): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    const constractHash = ETH_AIRDROP_CLAIM_CONTRACT;
    const list = await this.getContractJson('airdropList');
    const listArr = [];
    for (const key in list) {
      if (Object.prototype.hasOwnProperty.call(list, key)) {
        const element = list[key];
        listArr.push({
          account: key,
          amount: ethers.BigNumber.from(element.amount),
        });
      }
    }
    const json = await this.getContractJson('airdrop');
    const addressKey = Object.keys(list).find(
      (key) => key.toLowerCase() === this.vaultWallet.address.toLowerCase()
    );
    const o3Contract = new this.web3.eth.Contract(json, constractHash);
    const addressInfo = list[addressKey];
    const account = addressKey;
    const amount = ethers.BigNumber.from(addressInfo.amount);
    const balanceTree = new BalanceTree(listArr);
    const data = o3Contract.methods
      .claim(
        addressInfo.index,
        account,
        amount,
        balanceTree.getProof(addressInfo.index, account, amount)
      )
      .encodeABI();
    const requestData = {
      method: 'eth_sendTransaction',
      params: [
        this.swapService.getSendTransactionParams(account, constractHash, data),
      ],
    };
    return this.vaultdMetaMaskWalletApiService
      .sendTransaction(requestData, 'ETH')
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(
          O3_TOKEN,
          new BigNumber(addressInfo.amount).shiftedBy(-18).toFixed(),
          hash,
          VaultTransactionType.claim
        );
        return hash;
      });
  }
  //#endregion
  //#region private function
  private handleTx(
    fromToken: Token,
    inputAmount: string,
    txHash: string,
    transactionType: number
  ): void {
    const pendingTx: VaultTransaction = {
      txid: this.commonService.remove0xHash(txHash),
      isPending: true,
      isFailed: false,
      fromToken,
      amount: inputAmount,
      transactionType,
      min: false,
    };
    this.vaultTransaction = pendingTx;
    this.store.dispatch({
      type: UPDATE_VAULT_STAKE_PENDING_TX,
      data: pendingTx,
    });
    this.listenTxReceipt(txHash, UPDATE_VAULT_STAKE_PENDING_TX);
  }
  private listenTxReceipt(txHash: string, dispatchType: string): void {
    let myInterval = this.requestTxStatusInterval;
    if (myInterval) {
      myInterval.unsubscribe();
    }
    myInterval = interval(5000).subscribe(() => {
      const currentTx: VaultTransaction = this.vaultTransaction;
      this.rpcApiService
        .getEthTxReceipt(txHash, currentTx.fromToken.chain)
        .subscribe(
          (receipt) => {
            if (receipt) {
              myInterval.unsubscribe();
              if (new BigNumber(receipt.status, 16).isZero()) {
                currentTx.isPending = false;
                currentTx.isFailed = true;
                this.store.dispatch({ type: dispatchType, data: currentTx });
              } else {
                currentTx.isPending = false;
                this.store.dispatch({ type: dispatchType, data: currentTx });
              }
            }
          },
          (error) => {
            myInterval.unsubscribe();
            this.commonService.log(error);
          }
        );
    });
  }
  //#endregion
}

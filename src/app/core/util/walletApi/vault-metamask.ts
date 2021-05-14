import { Injectable } from '@angular/core';
import {
  ConnectChainType,
  EthWalletName,
  O3_TOKEN,
  MESSAGE,
  RESET_VAULT_WALLET,
  Token,
  UPDATE_VAULT_STAKE_PENDING_TX,
  UPDATE_VAULT_WALLET,
  O3STAKING_CONTRACT,
  O3TOKEN_CONTRACT,
} from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
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
import { map, take } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { RpcApiService } from '@core/api/rpc.service';
import { getMessageFromCode } from 'eth-rpc-errors';
import { NzNotificationService } from 'ng-zorro-antd/notification';
interface State {
  vault: any;
  language: any;
}
@Injectable()
export class VaultdMetaMaskWalletApiService {
  myWalletName: EthWalletName = 'MetaMask';
  requestTxStatusInterval: Unsubscribable;

  vault$: Observable<any>;
  vaultWallet: VaultWallet;
  vaultTransaction: VaultTransaction;

  ethereum;
  web3: Web3 = new Web3();
  o3Json;
  o3StakingJson;

  language$: Observable<any>;
  lang: string;

  constructor(
    private http: HttpClient,
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService,
    private rpcApiService: RpcApiService,
    private nzNotification: NzNotificationService
  ) {
    this.language$ = store.select('language');
    this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.vault$ = store.select('vault');
    this.vault$.subscribe((state) => {
      this.vaultWallet = state.vaultWallet;
      this.vaultTransaction = state.vaultTransaction;
    });
    if ((window as any).ethereum) {
      this.myWalletName = (window as any).ethereum.isO3Wallet
        ? 'O3'
        : 'MetaMask';
    }
  }

  //#region connect
  init(): void {
    this.handleLocalTx();
    const intervalReq = interval(1000)
      .pipe(take(5))
      .subscribe(() => {
        if (!(window as any).ethereum) {
          return;
        } else {
          intervalReq.unsubscribe();
        }
        this.ethereum = (window as any).ethereum;
        this.web3 = (window as any).ethereum
          ? new Web3((window as any).ethereum)
          : new Web3();
        if (this.ethereum.isConnected()) {
          this.ethereum.request({ method: 'eth_accounts' }).then((result) => {
            if (result.length === 0) {
              return;
            }
            const localVaultWallet = JSON.parse(
              sessionStorage.getItem('vaulteWallet')
            );
            if (
              localVaultWallet &&
              localVaultWallet.walletName === 'MetaMask'
            ) {
              this.vaultConnect(localVaultWallet.chain, false);
            }
          });
        }
      });
  }
  vaultConnect(chain: string, showMessage = true): Promise<VaultWallet> {
    if (!(window as any).ethereum) {
      this.swapService.toDownloadWallet(this.myWalletName);
      return;
    }
    this.web3 = new Web3((window as any).ethereum);
    this.ethereum = (window as any).ethereum;
    return this.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then((result) => {
        if (result.length <= 0) {
          return;
        }
        this.commonService.log(result);
        if (showMessage) {
          this.nzMessage.success(MESSAGE.ConnectionSucceeded[this.lang]);
        }
        this.vaultWallet = {
          walletName: this.myWalletName,
          address: result[0],
          chain: chain as ConnectChainType,
        };
        this.store.dispatch({
          type: UPDATE_VAULT_WALLET,
          data: this.vaultWallet,
        });
        this.addListener();
        return this.vaultWallet;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }
  //#endregion

  //#region vault staking
  async o3StakingStake(
    token: Token,
    inputAmount: string,
    address?: string
  ): Promise<any> {
    const json = await this.getO3StakingJson();
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
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            address || this.vaultWallet.address,
            o3StakingContractHash,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, VaultTransactionType.stake);
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async o3StakingUnStake(token: Token, inputAmount: string): Promise<any> {
    const json = await this.getO3StakingJson();
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
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            this.vaultWallet.address,
            o3StakingContractHash,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, VaultTransactionType.unstake);
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async o3StakingClaimProfit(
    token: Token,
    profit: string,
    address?: string
  ): Promise<any> {
    const json = await this.getO3StakingJson();
    const o3StakingContractHash = O3STAKING_CONTRACT[token.assetID];
    const o3StakingContract = new this.web3.eth.Contract(
      json,
      o3StakingContractHash
    );
    const data = o3StakingContract.methods.claimProfit().encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            address || this.vaultWallet.address,
            o3StakingContractHash,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(O3_TOKEN, profit, hash, VaultTransactionType.claim);
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async getO3StakingTotalStaing(token: Token): Promise<string> {
    let params;
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    const json = await this.getO3StakingJson();
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods.totalStaked().encodeABI();
    params = [
      this.getSendTransactionParams(
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
    const json = await this.getO3StakingJson();
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods.getSharePerBlock().encodeABI();
    params = [
      this.getSendTransactionParams(
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
    const json = await this.getO3StakingJson();
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods
      .getTotalProfit(address || this.vaultWallet.address)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
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
    const json = await this.getO3StakingJson();
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods
      .getStakingAmount(address || this.vaultWallet.address)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
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
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = o3Contract.methods
      .stake(
        token.assetID,
        new BigNumber(inputAmount).shiftedBy(token.decimals).dp(0).toFixed()
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            this.vaultWallet.address,
            O3TOKEN_CONTRACT,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, VaultTransactionType.stake);
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async unstakeO3(token: Token, inputAmount: string): Promise<any> {
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = o3Contract.methods
      .unstake(
        token.assetID,
        new BigNumber(inputAmount).shiftedBy(token.decimals).dp(0).toFixed()
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            this.vaultWallet.address,
            O3TOKEN_CONTRACT,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, VaultTransactionType.unstake);
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async claimUnlocked(token: Token, unlocked: string): Promise<any> {
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = o3Contract.methods.claimUnlocked(token.assetID).encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            this.vaultWallet.address,
            O3TOKEN_CONTRACT,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(O3_TOKEN, unlocked, hash, VaultTransactionType.claim);
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async getUnlockedOf(): Promise<string> {
    const token = O3_TOKEN;
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods
      .unlockedOf(this.vaultWallet.address)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
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
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods
      .lockedOf(this.vaultWallet.address)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
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
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods.getStaked(token.assetID).encodeABI();
    params = [
      this.getSendTransactionParams(
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
      .catch((error) => {});
  }
  async getUnlockSpeed(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods
      .getUnlockSpeed(this.vaultWallet.address, token.assetID)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
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
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3TOKEN_CONTRACT);
    const data = await o3Contract.methods
      .claimableUnlocked(token.assetID)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
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
  //#endregion

  //#region private function
  private handleDapiError(error): void {
    const title = getMessageFromCode(error.code);
    if (error.message && error.code !== 4001) {
      this.nzNotification.error(title, error.message);
    } else {
      this.nzMessage.error(title);
    }
  }

  private addListener(): void {
    this.ethereum.on('accountsChanged', (accounts) => {
      if (
        this.vaultWallet &&
        this.vaultWallet.walletName === this.myWalletName
      ) {
        const accountAddress = accounts.length > 0 ? accounts[0] : null;
        if (accountAddress !== null) {
          this.vaultWallet.address = accountAddress;
          this.store.dispatch({
            type: UPDATE_VAULT_WALLET,
            data: this.vaultWallet,
          });
        } else {
          this.store.dispatch({ type: RESET_VAULT_WALLET });
        }
      }
    });
  }

  private handleLocalTx(): void {
    const localTxString = localStorage.getItem('vaultTransaction');
    if (localTxString === null || localTxString === undefined) {
      return;
    }
    const localTx: VaultTransaction = JSON.parse(localTxString);
    if (
      localTx.fromToken.chain === 'NEO' ||
      localTx.walletName !== 'MetaMask'
    ) {
      return;
    }
    this.vaultTransaction = localTx;
    this.store.dispatch({ type: UPDATE_VAULT_STAKE_PENDING_TX, data: localTx });
    if (localTx.isPending === false) {
      return;
    }
    this.listenTxReceipt(localTx.txid, UPDATE_VAULT_STAKE_PENDING_TX);
  }

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
      walletName: 'MetaMask',
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

  private getO3Json(): Promise<any> {
    if (this.o3Json) {
      return of(this.o3Json).toPromise();
    }
    return this.http
      .get('assets/contracts-json/O3.json')
      .pipe(
        map((res) => {
          this.o3Json = res;
          return res;
        })
      )
      .toPromise();
  }
  private getO3StakingJson(): Promise<any> {
    if (this.o3StakingJson) {
      return of(this.o3StakingJson).toPromise();
    }
    return this.http
      .get('assets/contracts-json/O3Staking.json')
      .pipe(
        map((res) => {
          this.o3StakingJson = res;
          return res;
        })
      )
      .toPromise();
  }

  private getSendTransactionParams(
    from: string,
    to: string,
    data: string,
    value?: string,
    gas?: string,
    gasPrice?: string
  ): object {
    if (value && !value.startsWith('0x')) {
      value = '0x' + new BigNumber(value).toString(16);
    }
    to = this.commonService.add0xHash(to);
    return {
      from,
      to,
      value,
      gas,
      gasPrice,
      data,
    };
  }
  //#endregion
}

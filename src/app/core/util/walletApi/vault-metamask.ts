import { Injectable } from '@angular/core';
import {
  ConnectChainType,
  EthWalletName,
  O3_TOKEN,
  MESSAGE,
  RESET_VAULT_WALLET,
  StakeTransaction,
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
import { VaultWallet } from 'src/app/_lib/vault';
import { HttpClient } from '@angular/common/http';
import { map, take } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { RpcApiService } from '@core/api/rpc.service';
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
  transaction: StakeTransaction;

  ethereum;
  web3: Web3;
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
    private rpcApiService: RpcApiService
  ) {
    this.language$ = store.select('language');
    this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.vault$ = store.select('vault');
    this.vault$.subscribe((state) => {
      this.vaultWallet = state.vaultWallet;
    });
  }

  //#region connect
  init(): void {
    this.handleLocalTx();
    setTimeout(() => {
      if ((window as any).ethereum && (window as any).ethereum.isConnected()) {
        (window as any).ethereum
          .request({ method: 'eth_accounts' })
          .then((result) => {
            if (result.length === 0) {
              return;
            }
            const localVaultWallet = JSON.parse(
              sessionStorage.getItem('valueWallet')
            );
            if (
              localVaultWallet &&
              localVaultWallet.walletName === 'MetaMask'
            ) {
              this.vaultConnect(localVaultWallet.chain, false);
            }
          });
      }
    }, 1000);
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

  //#region vault staking
  async o3StakingStake(token: Token, inputAmount: string): Promise<any> {
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
            this.vaultWallet.address,
            o3StakingContractHash,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, inputAmount, hash, true);
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
        this.handleTx(token, inputAmount, hash, false);
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async o3StakingClaimProfit(token: Token, profit: string): Promise<any> {
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
            this.vaultWallet.address,
            o3StakingContractHash,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(token, profit, hash, false, true);
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async getO3StakingTotalStaing(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    const json = await this.getO3StakingJson();
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods.totalStaked().encodeABI();
    params = [
      this.getSendTransactionParams(
        this.vaultWallet.address,
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
  async getO3StakingTotalProfit(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    const json = await this.getO3StakingJson();
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods
      .getTotalProfit(this.vaultWallet.address)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
        this.vaultWallet.address,
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
  async getO3StakingStaked(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    const json = await this.getO3StakingJson();
    const o3Contract = new this.web3.eth.Contract(json, contractHash);
    const data = await o3Contract.methods
      .getStakingAmount(this.vaultWallet.address)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
        this.vaultWallet.address,
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
        this.handleTx(token, inputAmount, hash, true);
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
        this.handleTx(token, inputAmount, hash, false);
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
        this.handleTx(O3_TOKEN, unlocked, hash, false, true);
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
    this.commonService.log(error);
    switch (error.code) {
      case 4001:
        this.nzMessage.error('The request was rejected by the user');
        break;
      case -32602:
        this.nzMessage.error('The parameters were invalid');
        break;
      case -32603:
        this.nzMessage.error('Internal error'); // transaction underpriced
        break;
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
    const localTx: StakeTransaction = JSON.parse(localTxString);
    console.log(localTx);
    this.transaction = localTx;
    if (localTx.isPending === false) {
      return;
    }
    if (!this.ethereum) {
      const ethereumiInterval = interval(1000)
        .pipe(take(5))
        .subscribe(() => {
          if (!this.ethereum) {
            return;
          } else {
            ethereumiInterval.unsubscribe();
            this.listenTxReceipt(localTx.txid, UPDATE_VAULT_STAKE_PENDING_TX);
          }
        });
    } else {
      this.listenTxReceipt(localTx.txid, UPDATE_VAULT_STAKE_PENDING_TX);
    }
  }

  private handleTx(
    fromToken: Token,
    inputAmount: string,
    txHash: string,
    isStake: boolean,
    isClaim: boolean = false
  ): void {
    const pendingTx: StakeTransaction = {
      txid: this.commonService.remove0xHash(txHash),
      isPending: true,
      isFailed: false,
      fromToken,
      amount: inputAmount,
      transactionType: isClaim ? 2 : isStake ? 1 : 0,
      min: false,
      walletName: 'MetaMask',
    };
    this.transaction = pendingTx;
    this.store.dispatch({
      type: UPDATE_VAULT_STAKE_PENDING_TX,
      data: pendingTx,
    });
    this.listenTxReceipt(txHash, UPDATE_VAULT_STAKE_PENDING_TX);
  }

  private listenTxReceipt(txHash: string, dispatchType: string): void {
    if (!this.ethereum) {
      return;
    }
    let myInterval = this.requestTxStatusInterval;
    if (myInterval) {
      myInterval.unsubscribe();
    }
    myInterval = interval(5000).subscribe(() => {
      let currentTx: StakeTransaction;
      currentTx = this.transaction;
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

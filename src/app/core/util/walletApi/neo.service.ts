import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SwapService } from '../swap.service';
import { CommonService } from '../common.service';
import { ApiService } from '../../api/api.service';
import {
  NeoWalletName,
  NEO_SWAP_CONTRACT_HASH,
  Token,
  AssetQueryResponseItem,
  SwapStateType,
  UPDATE_PENDING_TX,
  SwapTransaction,
  NEO_NNEO_CONTRACT_HASH,
  Network,
  NETWORK,
  SWAP_CONTRACT_CHAIN_ID,
  MESSAGE,
  SwapTransactionType,
} from '@lib';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { wallet } from '@cityofzion/neon-js';
import BigNumber from 'bignumber.js';
import { RpcApiService } from '../../api/rpc.service';
import { NeolineWalletApiService } from './neoline';
import { O3NeoWalletApiService } from './o3-neo';

interface State {
  swap: SwapStateType;
  language: any;
}

@Injectable()
export class NeoApiService {
  private listenTxinterval: Unsubscribable;

  private swap$: Observable<any>;
  private neoWalletName: NeoWalletName;
  private neoAccountAddress: string;
  private transaction: SwapTransaction;
  private neolineNetwork: Network;

  private language$: Observable<any>;
  private lang: string;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService,
    private apiService: ApiService,
    private rpcApiService: RpcApiService,
    private neolineWalletApiService: NeolineWalletApiService,
    private o3NeoWalletApiService: O3NeoWalletApiService
  ) {
    this.language$ = store.select('language');
    this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.neoWalletName = state.neoWalletName;
      this.neoAccountAddress = state.neoAccountAddress;
      this.transaction = Object.assign({}, state.transaction);
      this.neolineNetwork = state.neolineNetwork;
    });
  }

  initTx(): void {
    const localTxString = localStorage.getItem('transaction');
    if (localTxString === null || localTxString === undefined) {
      return;
    }
    const localTx: SwapTransaction = JSON.parse(localTxString);
    if (localTx.fromToken.chain !== 'NEO') {
      return;
    }
    this.transaction = localTx;
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: localTx });
    if (localTx.isPending === false) {
      return;
    }
    this.listenTxReceipt();
  }

  //#region NEO nNEO swap
  async mintNNeo(
    fromToken: Token, // neo
    toToken: Token, // nneo
    inputAmount: string
  ): Promise<string> {
    const walletName = this.neoWalletName;
    if (this.checkNeoLineNetwork(walletName) === false) {
      return;
    }
    const checkBalance = await this.swapService.getNeoBalances(
      walletName,
      fromToken.assetID,
      inputAmount
    );
    if (checkBalance !== true) {
      this.nzMessage.error(MESSAGE.InsufficientBalance[this.lang]);
      return;
    }
    const params = {
      scriptHash: NEO_NNEO_CONTRACT_HASH,
      operation: 'mintTokens',
      args: [],
      attachedAssets: {
        NEO: inputAmount,
      },
    };
    return this.getNeoDapiService(walletName)
      .invoke(params)
      .then((txid) => {
        this.handleTx(
          walletName,
          fromToken,
          toToken,
          inputAmount,
          new BigNumber(inputAmount).shiftedBy(toToken.decimals).toFixed(),
          txid
        );
        return txid;
      });
  }

  async releaseNeo(
    fromToken: Token, // nneo
    toToken: Token, // neo
    inputAmount: string,
    toAddress: string
  ): Promise<string> {
    const walletName = this.neoWalletName;
    if (this.checkNeoLineNetwork(walletName) === false) {
      return;
    }
    const checkBalance = await this.swapService.getNeoBalances(
      walletName,
      fromToken.assetID,
      inputAmount
    );
    if (checkBalance !== true) {
      this.nzMessage.error(MESSAGE.InsufficientBalance[this.lang]);
      return;
    }
    const utxoRes = await this.apiService.getUtxo(toAddress, inputAmount);
    if (utxoRes === false) {
      this.nzMessage.error(MESSAGE.SystemBusy[this.lang]);
      return;
    }
    const params = {
      scriptHash: NEO_NNEO_CONTRACT_HASH,
      operation: 'refund',
      args: [
        {
          type: 'Address', // 收件人地址
          value: toAddress,
        },
      ],
      assetIntentOverrides: {
        inputs: utxoRes.utxoList,
        outputs: [
          {
            address: wallet.getAddressFromScriptHash(NEO_NNEO_CONTRACT_HASH), // 合约地址
            asset: toToken.assetID, // neo asset Id
            value: inputAmount,
          },
          // 还有可能会有找零。应该是 getUxo得到的 sum - amount
        ],
      },
      triggerContractVerification: false,
      extra_witness: [
        {
          invocationScript: '520131',
          verificationScript: '',
          scriptHash: NEO_NNEO_CONTRACT_HASH,
        },
      ],
    };
    if (utxoRes.sum > inputAmount) {
      params.assetIntentOverrides.outputs.push({
        address: wallet.getAddressFromScriptHash(NEO_NNEO_CONTRACT_HASH), // 合约地址
        asset: toToken.assetID, // neo asset Id
        value: String(utxoRes.sum - Number(inputAmount)),
      });
    }
    return this.getNeoDapiService(walletName)
      .invoke(params)
      .then((txid) => {
        this.handleTx(
          walletName,
          fromToken,
          toToken,
          inputAmount,
          inputAmount,
          txid
        );
        return txid;
      });
  }
  //#endregion

  //#region swap
  async swap(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    slipValue: number,
    deadline: number
  ): Promise<string> {
    const walletName = this.neoWalletName;
    if (this.checkNeoLineNetwork(walletName) === false) {
      return;
    }
    const checkBalance = await this.swapService.getNeoBalances(
      walletName,
      fromToken.assetID,
      inputAmount
    );
    if (checkBalance !== true) {
      this.nzMessage.error(MESSAGE.InsufficientBalance[this.lang]);
      return;
    }
    const toNeoswapPath = await this.apiService.getToStandardSwapPath(
      fromToken,
      inputAmount
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const args = [
      {
        type: 'Address',
        value: this.neoAccountAddress,
      },
      {
        type: 'Integer',
        value: this.swapService.getAmountIn(fromToken, inputAmount),
      },
      {
        type: 'Integer',
        value: this.swapService.getMinAmountOut(receiveAmount, slipValue),
      },
      {
        type: 'Array',
        value: chooseSwapPath.assetHashPath.map((assetHash) => ({
          type: 'Hash160',
          value: assetHash,
        })),
      },
      {
        type: 'Array',
        value: toNeoswapPath.map((assetHash) => ({
          type: 'Hash160',
          value: assetHash,
        })),
      },
      {
        type: 'Integer',
        value: Math.floor(Date.now() / 1000 + deadline * 60),
      },
      {
        type: 'Integer',
        value: 0,
      },
    ];
    const params = {
      scriptHash: NEO_SWAP_CONTRACT_HASH,
      operation: 'DelegateSwapTokenInForTokenOut',
      args,
    };
    return this.getNeoDapiService(walletName)
      .invoke(params)
      .then((txid) => {
        this.handleTx(
          walletName,
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          txid
        );
        return txid;
      });
  }

  async swapCrossChain(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    slipValue: number,
    deadline: number,
    toAddress: string,
    isMix: boolean = false,
    crossAssetHash: string = ''
  ): Promise<string> {
    const walletName = this.neoWalletName;
    if (this.checkNeoLineNetwork(walletName) === false) {
      return;
    }
    const checkBalance = await this.swapService.getNeoBalances(
      walletName,
      fromToken.assetID,
      inputAmount
    );
    if (checkBalance !== true) {
      this.nzMessage.error(MESSAGE.InsufficientBalance[this.lang]);
      return;
    }
    const toNeoswapPath = await this.apiService.getToStandardSwapPath(
      fromToken,
      inputAmount
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const args = [
      {
        type: 'Address',
        value: this.neoAccountAddress,
      },
      {
        type: 'Integer',
        value: this.swapService.getAmountIn(fromToken, inputAmount),
      },
      {
        type: 'Integer',
        value: this.swapService.getMinAmountOut(receiveAmount, slipValue),
      },
      {
        type: 'Array',
        value: chooseSwapPath.assetHashPath,
      },
      {
        type: 'Array',
        value: toNeoswapPath.map((assetHash) => ({
          type: 'Hash160',
          value: assetHash,
        })),
      },
      {
        type: 'Integer',
        value: Math.floor(Date.now() / 1000 + deadline * 60),
      },
      {
        type: 'Integer',
        value: 0,
      },
      {
        type: 'Hash160',
        value: this.swapService.getHash160FromAddress(toAddress),
      },
      {
        type: 'Integer', // toChainID (目标链id)
        value: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      },
      {
        type: 'Integer',
        value: 0,
      },
      {
        type: 'Boolean',
        value: isMix,
      },
      {
        type: 'Hash160',
        value: crossAssetHash,
      },
    ];
    const params = {
      scriptHash: NEO_SWAP_CONTRACT_HASH,
      operation: 'DelegateSwapTokenInForTokenOutNCrossChain',
      args,
    };
    return this.getNeoDapiService(walletName)
      .invoke(params)
      .then((txid) => {
        this.handleTx(
          walletName,
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          txid,
          false
        );
        return txid;
      });
  }
  //#endregion

  //#region private function
  private checkNeoLineNetwork(walletName: NeoWalletName): boolean {
    if (walletName === 'O3') {
      return true;
    }
    if (this.neolineNetwork !== NETWORK) {
      this.nzMessage.error(MESSAGE.SwitchNeolineNetwork[this.lang]([NETWORK]));
      return false;
    }
    return true;
  }
  private handleTx(
    walletName: NeoWalletName,
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    receiveAmount: string,
    txHash: string,
    addLister = true
  ): void {
    if (!txHash) {
      return;
    }
    const pendingTx: SwapTransaction = {
      txid: this.commonService.remove0xHash(txHash),
      isPending: true,
      min: false,
      fromToken,
      toToken,
      amount: inputAmount,
      receiveAmount: new BigNumber(receiveAmount)
        .shiftedBy(-toToken.decimals)
        .toFixed(),
      walletName,
      transactionType: SwapTransactionType.swap,
    };
    if (addLister === false) {
      pendingTx.progress = {
        step1: { hash: this.commonService.remove0xHash(txHash), status: 1 },
        step2: { hash: '', status: 0 },
        step3: { hash: '', status: 0 },
      };
    }
    this.transaction = pendingTx;
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
    if (addLister) {
      this.listenTxReceipt();
    }
  }
  private listenTxReceipt(): void {
    const getTx = () => {
      if (JSON.stringify(this.transaction) === '{}') {
        if (this.listenTxinterval) {
          this.listenTxinterval.unsubscribe();
        }
        return;
      }
      this.rpcApiService
        .getNeoTxByHash(this.transaction.txid, this.transaction.walletName)
        .then((txid) => {
          if (
            txid &&
            this.commonService.add0xHash(txid) ===
              this.commonService.add0xHash(this.transaction.txid)
          ) {
            if (this.listenTxinterval) {
              this.listenTxinterval.unsubscribe();
            }
            this.transaction.isPending = false;
            this.store.dispatch({
              type: UPDATE_PENDING_TX,
              data: this.transaction,
            });
            this.swapService.getNeoBalances(
              this.transaction.walletName as NeoWalletName
            );
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };
    getTx();
    if (this.listenTxinterval) {
      this.listenTxinterval.unsubscribe();
    }
    this.listenTxinterval = interval(5000).subscribe(() => {
      getTx();
    });
  }
  private getNeoDapiService(walletName: NeoWalletName): any {
    return walletName === 'O3'
      ? this.o3NeoWalletApiService
      : this.neolineWalletApiService;
  }
  //#endregion
}

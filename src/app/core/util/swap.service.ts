import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import {
  ALL_PERCENTAGE,
  Token,
  WalletName,
  NeoWalletName,
  CHAINS,
  ETH_SOURCE_ASSET_HASH,
  SwapStateType,
  INIT_CHAIN_TOKENS,
  UPDATE_BSC_BALANCES,
  UPDATE_ETH_BALANCES,
  UPDATE_HECO_BALANCES,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_WALLET_NAME,
} from '@lib';
import { CommonService } from './common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { interval, Observable, of, Unsubscribable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getMessageFromCode } from 'eth-rpc-errors';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { RpcApiService } from '../api/rpc.service';
import Web3 from 'web3';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';

interface State {
  swap: SwapStateType;
  tokens: any;
  language: any;
}

@Injectable()
export class SwapService {
  private web3 = new Web3();
  private ethBlockNumberInterval: Unsubscribable;
  private neoBlockNumberInterval: Unsubscribable;

  private swap$: Observable<any>;
  private walletName = { ETH: '', BSC: '', HECO: '', NEO: '' };
  private accountAddress = { ETH: '', BSC: '', HECO: '', NEO: '' };

  private tokens$: Observable<any>;
  private chainTokens = INIT_CHAIN_TOKENS;

  private swapJson = {};
  private aggregatorSwapJson = {
    BSC: {
      Pancakeswap: null,
    },
    ETH: {
      Uniswap: null,
    },
    HECO: {
      'Mdex-Heco': null,
    },
  };

  constructor(
    private store: Store<State>,
    private commonService: CommonService,
    private nzMessage: NzMessageService,
    private nzNotification: NzNotificationService,
    private rpcApiService: RpcApiService,
    private http: HttpClient
  ) {
    this.swap$ = store.select('swap');
    this.tokens$ = store.select('tokens');
    this.swap$.subscribe((state) => {
      this.walletName.NEO = state.neoWalletName;
      this.walletName.ETH = state.ethWalletName;
      this.walletName.BSC = state.bscWalletName;
      this.walletName.HECO = state.hecoWalletName;
      this.accountAddress.NEO = state.neoAccountAddress;
      this.accountAddress.ETH = state.ethAccountAddress;
      this.accountAddress.BSC = state.bscAccountAddress;
      this.accountAddress.HECO = state.hecoAccountAddress;
    });
    this.tokens$.subscribe((state) => {
      this.chainTokens = state.chainTokens;
    });
  }

  //#region balance
  getNeoBalances(
    walletName: NeoWalletName,
    fromTokenAssetId?: string,
    inputAmount?: string
  ): Promise<boolean> {
    return this.rpcApiService
      .getNeoTokenBalances(this.accountAddress.NEO, walletName)
      .then((addressTokens) => {
        if (this.walletName.NEO !== walletName) {
          return;
        }
        this.dispatchUpdateBalance('NEO', addressTokens);
        if (
          addressTokens[fromTokenAssetId] &&
          new BigNumber(addressTokens[fromTokenAssetId].amount).comparedTo(
            new BigNumber(inputAmount)
          ) >= 0
        ) {
          return true;
        } else {
          return false;
        }
      });
  }
  async getEthBalance(
    chain: CHAINS,
    isUpdate = true,
    address?: string
  ): Promise<boolean> {
    if (!this.accountAddress[chain] && !address) {
      return;
    }
    const tempTokenBalance: Token[] = JSON.parse(
      JSON.stringify(this.chainTokens[chain])
    );
    return new Promise(async (resolve, reject) => {
      const result = {};
      for (const item of tempTokenBalance) {
        const tempAmount = await this.getEthBalancByHash(item, address);
        if (tempAmount) {
          result[item.assetID] = JSON.parse(JSON.stringify(item));
          result[item.assetID].amount = tempAmount;
          if (isUpdate === false) {
            this.dispatchUpdateBalance(chain, result);
          }
        }
      }
      if (isUpdate === true) {
        this.dispatchUpdateBalance(chain, result);
      }
      resolve(true);
    });
  }
  async getEthBalancByHash(token: Token, address?: string): Promise<string> {
    if ((!this.accountAddress[token.chain] && !address) || address === '') {
      return;
    }
    address = address || this.accountAddress[token.chain];
    let params;
    if (token.assetID !== ETH_SOURCE_ASSET_HASH) {
      const json = await this.getSwapJson('ethErc20');
      const ethErc20Contract = new this.web3.eth.Contract(json, token.assetID);
      const data = await ethErc20Contract.methods
        .balanceOf(address)
        .encodeABI();
      params = [
        this.getSendTransactionParams(address, token.assetID, data),
        'latest',
      ];
    } else {
      params = [address, 'latest'];
    }
    return this.rpcApiService.getEthTokenBalance(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  //#endregion

  //#region contract json
  getAggregatorSwapJson(chain: CHAINS, aggregator: string): Promise<any> {
    if (this.aggregatorSwapJson[chain][aggregator]) {
      return of(this.aggregatorSwapJson[chain][aggregator]).toPromise();
    }
    return this.http
      .get(`assets/contracts-json/O3Swap${chain}${aggregator}Bridge.json`)
      .pipe(
        map((res) => {
          this.aggregatorSwapJson[chain][aggregator] = res;
          return res;
        })
      )
      .toPromise();
  }

  getSwapJson(
    type: 'wEth' | 'swapper' | 'polyWrapper' | 'ethErc20'
  ): Promise<any> {
    if (this.swapJson[type]) {
      return of(this.swapJson[type]).toPromise();
    }
    let pathName: string;
    switch (type) {
      case 'wEth':
        pathName = 'weth';
        break;
      case 'swapper':
        pathName = 'eth-swapper';
        break;
      case 'polyWrapper':
        pathName = 'PolyWrapper';
        break;
      case 'ethErc20':
        pathName = 'eth-erc20';
        break;
    }
    return this.http
      .get(`assets/contracts-json/${pathName}.json`)
      .pipe(
        map((res) => {
          this.swapJson[type] = res;
          return res;
        })
      )
      .toPromise();
  }
  //#endregion

  //#region util
  getAmountIn(fromToken: Token, inputAmount: string): string {
    const factAmount = new BigNumber(inputAmount)
      .dividedBy(ALL_PERCENTAGE)
      .toFixed();
    return this.commonService.decimalToInteger(factAmount, fromToken.decimals);
  }
  getMinAmountOut(amountOut: string, slipValue: number): string {
    const factPercentage = new BigNumber(1).minus(
      new BigNumber(slipValue).shiftedBy(-2)
    );
    const factAmount = new BigNumber(amountOut)
      .times(factPercentage)
      .dp(0)
      .toFixed();
    return factAmount;
  }
  getAssetNamePath(swapPath: string[], tokens: Token[]): any[] {
    const target = [];
    swapPath.forEach((hash) => {
      const token = tokens.find(
        (item) =>
          this.commonService.remove0xHash(item.assetID).toLowerCase() ===
          this.commonService.remove0xHash(hash).toLowerCase()
      );
      target.push(token.symbol);
    });
    return target;
  }
  getHash160FromAddress(text: string): any {
    text = this.commonService.remove0xHash(text);
    return this.reverseHex(text);
  }
  getSendTransactionParams(
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
  updateAccount(chain: string, address: string, walletName: WalletName): void {
    let dispatchAccountType;
    let dispatchWalletNameType;
    switch (chain) {
      case 'NEO':
        dispatchAccountType = UPDATE_NEO_ACCOUNT;
        dispatchWalletNameType = UPDATE_NEO_WALLET_NAME;
        break;
      case 'ETH':
        dispatchAccountType = UPDATE_ETH_ACCOUNT;
        dispatchWalletNameType = UPDATE_ETH_WALLET_NAME;
        break;
      case 'BSC':
        dispatchAccountType = UPDATE_BSC_ACCOUNT;
        dispatchWalletNameType = UPDATE_BSC_WALLET_NAME;
        break;
      case 'HECO':
        dispatchAccountType = UPDATE_HECO_ACCOUNT;
        dispatchWalletNameType = UPDATE_HECO_WALLET_NAME;
        break;
    }
    this.store.dispatch({
      type: dispatchAccountType,
      data: address,
    });
    this.store.dispatch({
      type: dispatchWalletNameType,
      data: walletName,
    });
  }
  //#endregion

  //#region block number listen
  listenEthBlockNumber(): void {
    if (this.ethBlockNumberInterval) {
      return;
    }
    this.ethBlockNumberInterval = interval(15000).subscribe(() => {
      if (
        // 没有连接时不获取 balances
        !this.walletName.ETH &&
        !this.walletName.BSC &&
        !this.walletName.HECO
      ) {
        this.ethBlockNumberInterval.unsubscribe();
      } else {
        this.getEthBalance('ETH');
        this.getEthBalance('BSC');
        this.getEthBalance('HECO');
      }
    });
  }
  listenNeoBlockNumber(): void {
    if (this.neoBlockNumberInterval) {
      return;
    }
    this.neoBlockNumberInterval = interval(15000).subscribe(() => {
      if (!this.walletName.NEO) {
        // 没有连接时不获取 balances
        this.neoBlockNumberInterval.unsubscribe();
      } else {
        this.getNeoBalances(this.walletName.NEO as NeoWalletName);
      }
    });
  }
  //#endregion

  //#region handle dapi error
  handleEthDapiError(error, walletName: WalletName): void {
    if (error.type && error.type === 'NO_PROVIDER') {
      this.toDownloadWallet(walletName);
      return;
    }
    const title = getMessageFromCode(error.code);
    if (error.message && error.code !== 4001) {
      this.nzNotification.error(title, error.message);
    } else {
      this.nzMessage.error(title);
    }
  }
  handleNeoDapiError(error, walletName: NeoWalletName): void {
    let message: string;
    switch (error.type) {
      case 'NO_PROVIDER':
        this.toDownloadWallet(walletName);
        break;
      case 'CONNECTION_DENIED':
        message = 'The user rejected the request to connect with your dApp';
        break;
      case 'RPC_ERROR':
        message = 'RPC connection to a network node fails';
        break;
      case 'MALFORMED_INPUT':
        message = 'The address is not a valid NEO address';
        break;
      case 'CANCELED':
        message = 'User cancels, or refuses the dapps request';
        break;
      case 'FAIL':
        message = 'The request failed';
        break;
      case 'INSUFFICIENT_FUNDS':
        message = 'Insufficient balance';
        break;
      default:
        if (typeof error === 'string') {
          message = error;
        } else {
          message = error.type || 'Unknown error';
        }
        break;
    }
    if (message) {
      this.nzMessage.error(message);
    }
  }
  toDownloadWallet(type: WalletName): void {
    switch (type) {
      case 'O3':
        window.open('https://o3.network/#download');
        break;
      case 'NeoLine':
        window.open(
          'https://chrome.google.com/webstore/detail/neoline/cphhlgmgameodnhkjdmkpanlelnlohao'
        );
        break;
      case 'MetaMask':
        window.open(
          'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
        );
        break;
    }
  }
  //#endregion

  //#region private function
  private reverseHex(hex): string {
    let out = '';
    for (let i = hex.length - 2; i >= 0; i -= 2) {
      out += hex.substr(i, 2);
    }
    return out;
  }
  private dispatchUpdateBalance(chain: CHAINS, balances): void {
    let dispatchBalanceType;
    switch (chain) {
      case 'NEO':
        dispatchBalanceType = UPDATE_NEO_BALANCES;
        break;
      case 'ETH':
        dispatchBalanceType = UPDATE_ETH_BALANCES;
        break;
      case 'BSC':
        dispatchBalanceType = UPDATE_BSC_BALANCES;
        break;
      case 'HECO':
        dispatchBalanceType = UPDATE_HECO_BALANCES;
        break;
    }
    this.store.dispatch({
      type: dispatchBalanceType,
      data: balances,
    });
  }
  //#endregion
}

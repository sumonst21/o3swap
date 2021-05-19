import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService, CommonService, SwapService } from '@core';
import {
  SwapStateType,
  SwapTransaction,
  UPDATE_PENDING_TX,
  UPDATE_BRIDGE_PENDING_TX,
  UPDATE_LIQUIDITY_PENDING_TX,
  TX_PAGES_PREFIX,
  POLY_TX_PAGES_PREFIX,
  TxProgress,
  TxAtPage,
  EthWalletName,
  UPDATE_VAULT_STAKE_PENDING_TX,
  SwapTransactionType,
  MESSAGE,
} from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnimationOptions } from 'ngx-lottie';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { VaultTransaction, VaultTransactionType } from 'src/app/_lib/vault';

interface State {
  vault: any;
  swap: SwapStateType;
  language: any;
}
@Component({
  selector: 'app-tx-progress',
  templateUrl: './tx-progress.component.html',
  styleUrls: ['./tx-progress.component.scss'],
})
export class TxProgressComponent implements OnInit, OnDestroy {
  @Input() txAtPage: TxAtPage;
  dispatchType: string;

  TX_PAGES_PREFIX = TX_PAGES_PREFIX;
  POLY_TX_PAGES_PREFIX = POLY_TX_PAGES_PREFIX;
  successOptions: AnimationOptions = {
    path: '/assets/json/success.json',
    loop: false,
  };
  pendingOptions = {
    path: '/assets/json/pending.json',
  };
  pendingMinOptions = {
    path: '/assets/json/pending-min.json',
  };
  txCompleteOptions = {
    path: '/assets/json/tx-complete.json',
    loop: false,
  };
  txPendingOptions = {
    path: '/assets/json/tx-waiting.json',
  };
  showTxModal = false;
  showTxDetail = false;
  hasTransaction = false;

  swapTransactionType = SwapTransactionType;
  swap$: Observable<any>;
  swapUnScribe: Unsubscribable;
  transaction: SwapTransaction;

  vault$: Observable<any>;
  vaultUnScribe: Unsubscribable;
  vaultTransaction: VaultTransaction;
  vaultTransactionType = VaultTransactionType;

  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

  requestCrossInterval: Unsubscribable;
  swapProgress = 20;
  minMessage: string;

  langPageName = 'swap';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  showModal = true;

  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
      this.getMinMessage();
    });
    this.swap$ = store.select('swap');
    this.vault$ = store.select('vault');
  }

  ngOnInit(): void {
    if (this.commonService.isMobileWidth()) {
      this.showModal = false;
    }
    switch (this.txAtPage) {
      case 'swap':
        this.dispatchType = UPDATE_PENDING_TX;
        break;
      case 'bridge':
        this.dispatchType = UPDATE_BRIDGE_PENDING_TX;
        break;
      case 'liquidity':
        this.dispatchType = UPDATE_LIQUIDITY_PENDING_TX;
        break;
      case 'vault':
        this.dispatchType = UPDATE_VAULT_STAKE_PENDING_TX;
        break;
    }
    this.swapUnScribe = this.swap$.subscribe((state) => {
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      switch (this.txAtPage) {
        case 'swap':
          this.hasTransaction = state.transaction ? true : false;
          if (this.hasTransaction) {
            this.handleTransacction(state.transaction);
            this.getMinMessage();
          }
          break;
        case 'bridge':
          this.hasTransaction = state.bridgeeTransaction ? true : false;
          if (this.hasTransaction) {
            this.handleTransacction(state.bridgeeTransaction);
            this.getMinMessage();
          }
          break;
        case 'liquidity':
          this.hasTransaction = state.liquidityTransaction ? true : false;
          if (this.hasTransaction) {
            this.handleTransacction(state.liquidityTransaction);
            this.getMinMessage();
          }
          break;
      }
      if (!this.hasTransaction && this.requestCrossInterval) {
        this.requestCrossInterval.unsubscribe();
      }
    });
    this.vaultUnScribe = this.vault$.subscribe((state) => {
      if (!state.vaultWallet || this.txAtPage !== 'vault') {
        return;
      }
      this.ethWalletName = state.vaultWallet.walletName;
      this.hasTransaction = state.vaultTransaction ? true : false;
      if (this.hasTransaction) {
        this.handleVaultTransacction(state.vaultTransaction);
        this.getMinMessage();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.requestCrossInterval) {
      this.requestCrossInterval.unsubscribe();
    }
    if (this.swapUnScribe) {
      this.swapUnScribe.unsubscribe();
    }
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  setRequestCrossInterval(): void {
    if (this.requestCrossInterval) {
      this.requestCrossInterval.unsubscribe();
    }
    let hasGetBalance1 = false;
    this.requestCrossInterval = interval(5000).subscribe(() => {
      this.apiService
        .getCrossChainSwapDetail(this.transaction.txid)
        .subscribe((res: TxProgress) => {
          this.commonService.log(res);
          this.transaction.progress = res;
          if (res.step1.status === 2 && hasGetBalance1 === false) {
            this.swapService.getEthBalance(this.transaction.fromToken.chain);
            hasGetBalance1 = true;
          }
          if (
            res.step1.status === 2 &&
            res.step2.status === 2 &&
            res.step3.status === 2
          ) {
            this.transaction.isPending = false;
            this.requestCrossInterval.unsubscribe();
            this.swapService.getEthBalance(this.transaction.fromToken.chain);
            this.swapService.getEthBalance(this.transaction.toToken.chain);
          }
          this.store.dispatch({
            type: this.dispatchType,
            data: this.transaction,
          });
        });
    });
  }

  minTxHashModal(): void {
    switch (this.txAtPage) {
      case 'vault':
        this.vaultTransaction.min = true;
        this.store.dispatch({
          type: this.dispatchType,
          data: this.vaultTransaction,
        });
        break;
      default:
        this.transaction.min = true;
        this.store.dispatch({
          type: this.dispatchType,
          data: this.transaction,
        });
    }
  }

  maxTxHashModal(): void {
    switch (this.txAtPage) {
      case 'vault':
        this.vaultTransaction.min = false;
        this.store.dispatch({
          type: this.dispatchType,
          data: this.vaultTransaction,
        });
        break;
      default:
        this.transaction.min = false;
        this.store.dispatch({
          type: this.dispatchType,
          data: this.transaction,
        });
    }
  }

  copy(hash: string): void {
    this.commonService.copy(hash);
  }

  closeTx(): void {
    this.transaction = null;
    this.store.dispatch({ type: this.dispatchType, data: null });
  }

  //#region private function
  getMinMessage(): void {
    let message: string;
    switch (this.txAtPage) {
      case 'vault':
        message =
          this.vaultTransaction.transactionType === 2
            ? MESSAGE.Claim[this.lang]
            : this.vaultTransaction.transactionType === 1
            ? MESSAGE.Unstake[this.lang]
            : MESSAGE.Stake[this.lang];
        message += ` ${this.vaultTransaction?.amount} ${this.vaultTransaction?.fromToken?.symbol}`;
        if (this.vaultTransaction.transactionType === 3) {
          message = `${MESSAGE.Approve[this.lang]} ${
            this.vaultTransaction?.fromToken?.symbol
          }`;
        }
        break;
      default:
        switch (this.transaction?.transactionType) {
          case SwapTransactionType.deposit:
            message = MESSAGE.Deposit[this.lang];
            break;
          case SwapTransactionType.withdraw:
            message = MESSAGE.Withdraw[this.lang];
            break;
          case SwapTransactionType.swap:
            message = MESSAGE.Swap[this.lang];
            break;
        }
        message += ` ${this.transaction?.amount} ${this.transaction?.fromToken?.symbol} for ${this.transaction?.receiveAmount} ${this.transaction?.toToken?.symbol}`;
        if (
          this.transaction?.transactionType === this.swapTransactionType.approve
        ) {
          message = `${MESSAGE.Approve[this.lang]} ${
            this.transaction?.fromToken?.symbol
          }`;
        }
    }
    if (message.length > 18) {
      message = message.slice(0, 15) + '...';
    }
    this.minMessage = message;
  }
  handleTransacction(stateTx): void {
    // 跨链交易定时查询交易状态
    if (
      stateTx &&
      stateTx.txid !== this.transaction?.txid &&
      stateTx.progress &&
      stateTx.isPending
    ) {
      this.transaction = Object.assign({}, stateTx);
      this.setRequestCrossInterval();
    }
    if (this.requestCrossInterval && !stateTx.progress) {
      this.requestCrossInterval.unsubscribe();
    }
    this.transaction = Object.assign({}, stateTx);
    this.showTxModal = this.transaction.min === false ? true : false;
    if (this.transaction.isPending === false) {
      this.swapProgress = 100;
    } else {
      if (this.transaction.progress) {
        if (this.transaction.progress.step3.status === 2) {
          this.swapProgress = 100;
        } else if (this.transaction.progress.step2.status === 2) {
          this.swapProgress = 66;
        } else if (this.transaction.progress.step1.status === 2) {
          this.swapProgress = 33;
        } else {
          this.swapProgress = 20;
        }
      } else {
        this.swapProgress = 20;
      }
    }
  }
  handleVaultTransacction(stateTx: VaultTransaction): void {
    this.vaultTransaction = Object.assign({}, stateTx);
    this.showTxModal = this.vaultTransaction.min === false ? true : false;
    if (this.vaultTransaction.isPending === false) {
      this.swapProgress = 100;
    } else {
      this.swapProgress = 20;
    }
  }
  //#endregion
}

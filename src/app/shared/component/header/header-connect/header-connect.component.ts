import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import {
  NeoWalletName,
  EthWalletName,
  UPDATE_NEO_ACCOUNT,
  SwapStateType,
  RESET_NEO_BALANCES,
  UPDATE_NEO_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  RESET_BSC_BALANCES,
  RESET_HECO_BALANCES,
  ConnectChainType,
  RESET_ETH_BALANCES,
} from '@lib';
import { CommonService } from '@core';
import { Store } from '@ngrx/store';
import { Observable, Unsubscribable } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AccountComponent } from '@shared/modal/account/account.component';

interface State {
  swap: SwapStateType;
  language: any;
}

@Component({
  selector: 'app-header-connect',
  templateUrl: './header-connect.component.html',
  styleUrls: ['../header-connect.scss', './header-connect.component.scss'],
})
export class HeaderConnectComponent implements OnInit, OnDestroy {
  connectChainType: ConnectChainType = 'ETH';
  showConnectModal = false; // connect wallet modal

  swapUnScribe: Unsubscribable;
  swap$: Observable<any>;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

  langPageName = 'app';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  isShowMobileModal = false;

  constructor(
    private store: Store<State>,
    private commonService: CommonService,
    private changeDetectorRef: ChangeDetectorRef,
    private modal: NzModalService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    this.swapUnScribe = this.swap$.subscribe((state) => {
      this.neoAccountAddress = state.neoAccountAddress;
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      this.neoWalletName = state.neoWalletName;
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.swapUnScribe) {
      this.swapUnScribe.unsubscribe();
    }
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  showConnect(): void {
    this.showConnectModal = true;
  }

  copy(value: string): void {
    this.commonService.copy(value);
  }

  showAccountModal(type: ConnectChainType): void {
    let walletName;
    let accountAddress;
    switch (type) {
      case 'NEO':
        walletName = this.neoWalletName;
        accountAddress = this.neoAccountAddress;
        break;
      case 'ETH':
        walletName = this.ethWalletName;
        accountAddress = this.ethAccountAddress;
        break;
      case 'BSC':
        walletName = this.bscWalletName;
        accountAddress = this.bscAccountAddress;
        break;
      case 'HECO':
        walletName = this.hecoWalletName;
        accountAddress = this.hecoAccountAddress;
        break;
    }
    const modal = this.modal.create({
      nzContent: AccountComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal',
      nzComponentParams: {
        chain: type,
        walletName,
        accountAddress,
      },
    });
    modal.afterClose.subscribe((res) => {
      if (res === 'change') {
        this.changeWallet(type);
      } else if (res === 'disconnect') {
        this.disConnect(type);
      }
    });
  }

  stopPropagation(e): void {
    e.stopPropagation();
  }

  //#region account modal
  disConnect(type: ConnectChainType): void {
    switch (type) {
      case 'ETH':
        this.ethWalletName = null;
        this.ethAccountAddress = null;
        this.store.dispatch({ type: UPDATE_ETH_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_ETH_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_ETH_BALANCES });
        break;
      case 'NEO':
        this.neoWalletName = null;
        this.neoAccountAddress = null;
        this.store.dispatch({ type: UPDATE_NEO_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_NEO_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_NEO_BALANCES });
        break;
      case 'BSC':
        this.bscWalletName = null;
        this.bscAccountAddress = null;
        this.store.dispatch({ type: UPDATE_BSC_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_BSC_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_BSC_BALANCES });
        break;
      case 'HECO':
        this.hecoWalletName = null;
        this.hecoAccountAddress = null;
        this.store.dispatch({ type: UPDATE_HECO_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_HECO_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_HECO_BALANCES });
        break;
    }
  }

  changeWallet(type: ConnectChainType): void {
    this.connectChainType = type;
    this.showConnectModal = true;
  }
  //#endregion
}

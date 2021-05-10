import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnDestroy,
} from '@angular/core';
import { CommonService } from '@core';
import { ConnectChainType, Wallet } from '@lib';
import { Store } from '@ngrx/store';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}

@Component({
  selector: 'app-wallet-connect-item',
  templateUrl: './wallet-connect-item.component.html',
  styleUrls: ['./wallet-connect-item.component.scss'],
})
export class WalletConnectItemComponent implements OnInit, OnDestroy {
  @Input() walletList: any[];
  @Input() chain: ConnectChainType;
  @Input() walletName: string;
  @Input() walletChain?: ConnectChainType;
  @Input() walletAddress: string;
  @Output() connect = new EventEmitter();

  langPageName = 'app';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private commonService: CommonService,
    private store: Store<State>
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }
  ngOnDestroy(): void {
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  ngOnInit(): void {}

  copy(value: string): void {
    this.commonService.copy(value);
  }

  connectWallet(wallet): void {
    this.connect.emit(wallet);
  }

  handleWalletDisplay(wallet: Wallet): boolean {
    if (wallet.name === this.walletName) {
      return false;
    }
    if (
      this.chain !== 'NEO' &&
      wallet.name === 'O3' &&
      this.commonService.isMobileWidth() === false
    ) {
      return false;
    }
    return true;
  }
  handleMobileWalletDisplay(wallet: Wallet): boolean {
    if (this.walletChain !== this.chain) {
      return false;
    }
    return this.handleWalletDisplay(wallet);
  }
}

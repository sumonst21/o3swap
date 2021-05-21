import { Component, OnInit } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import {
  NeolineWalletApiService,
  MetaMaskWalletApiService,
  VaultdMetaMaskWalletApiService,
  ApiService,
  NeoApiService,
  EthApiService,
} from '@core';
import { LOCAL_TRANSACTIONS_KEY, MyTransaction } from '@lib';
import { Store } from '@ngrx/store';
import { RiskWarningComponent } from '@shared';
import { NzModalService } from 'ng-zorro-antd/modal';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { INIT_TXS, UPDATE_LANGUAGE } from '@lib';

interface State {
  language: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  currentPage = this.router.url;
  isHome = true;
  showRisk = false;
  showMobileMenu = false;

  updateRatesInterval: Unsubscribable;

  langPageName = 'app';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private store: Store<State>,
    private router: Router,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private neolineWalletApiService: NeolineWalletApiService,
    private vaultdMetaMaskWalletApiService: VaultdMetaMaskWalletApiService,
    private modal: NzModalService,
    private apiService: ApiService,
    private ethApiService: EthApiService,
    private neoApiService: NeoApiService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.currentPage = res.urlAfterRedirects || res.url;
        this.isHome = this.isHomePage();
        // if (
        //   sessionStorage.getItem(`${this.currentPage}WarningDialog`) !==
        //     'true' &&
        //   location.pathname !== '/' &&
        //   location.pathname !== '/home'
        // ) {
        //   this.riskWarning();
        // }
        this.updateRates();
      }
    });
  }

  ngOnInit(): void {
    this.initLanguage();
    this.initLocalTxs();
    this.apiService.getRates();
    const sessionShowRisk = sessionStorage.getItem('showRisk');
    if (sessionShowRisk !== undefined) {
      this.showRisk = sessionShowRisk === 'false' ? false : true;
    }
    if (location.pathname !== '/' && location.pathname !== '/home') {
      this.neolineWalletApiService.initConnect();
      this.metaMaskWalletApiService.initConnect();
      this.vaultdMetaMaskWalletApiService.initConnect();
    }
  }

  initLanguage(): void {
    const localLang = localStorage.getItem('language');
    if (localLang) {
      this.lang = localLang;
      this.store.dispatch({ type: UPDATE_LANGUAGE, data: localLang });
    }
  }

  initLocalTxs(): void {
    localStorage.removeItem('transaction');
    localStorage.removeItem('bridgeeTransaction');
    localStorage.removeItem('liquidityTransaction');
    localStorage.removeItem('vaultTransaction');
    let localTxs: any = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (!localTxs) {
      return;
    }
    localTxs = JSON.parse(localTxs);
    this.store.dispatch({ type: INIT_TXS, data: localTxs });
    localTxs.forEach((item: MyTransaction) => {
      if (item.isPending === false) {
        return;
      }
      if (item.fromToken.chain === 'NEO') {
        this.neoApiService.listenTxReceipt(item);
      } else {
        this.ethApiService.listenTxReceipt(item);
      }
    });
  }

  updateRates(): void {
    if (!this.isHome) {
      if (this.updateRatesInterval) {
        return;
      }
      this.updateRatesInterval = interval(60000).subscribe(() => {
        this.apiService.getRates();
      });
    } else {
      if (this.updateRatesInterval) {
        this.updateRatesInterval.unsubscribe();
      }
    }
  }

  closeRisk(): void {
    this.showRisk = false;
    sessionStorage.setItem('showRisk', this.showRisk ? 'true' : 'false');
  }

  isHomePage(): boolean {
    if (this.currentPage === '/' || this.currentPage === '/home') {
      return true;
    }
    return false;
  }

  riskWarning(): void {
    const modal = this.modal.create({
      nzContent: RiskWarningComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzMaskClosable: false,
      nzClassName: 'custom-modal',
    });
    modal.afterClose.subscribe(() => {
      sessionStorage.setItem(`${this.currentPage}WarningDialog`, 'true');
    });
  }

  changeLang(lang: 'en' | 'zh'): void {
    if (lang === this.lang) {
      return;
    }
    this.showMobileMenu = false;
    this.lang = lang;
    this.store.dispatch({ type: UPDATE_LANGUAGE, data: lang });
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  }

  stopPropagation(e): void {
    e.stopPropagation();
  }

  toUrl(url: string): void {
    this.showMobileMenu = false;
    if (url.startsWith('http')) {
      window.open(url);
    } else {
      this.router.navigateByUrl(url);
    }
  }
}

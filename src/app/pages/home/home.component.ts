import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LiquiditySource } from './liquidity-source';
import { ApiService, CommonService } from '@core';
import { CommonHttpResponse, MESSAGE, UPDATE_LANGUAGE } from '@lib';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { Store } from '@ngrx/store';

interface State {
  language: any;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', './mobile.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public liquiditySource = LiquiditySource;
  public copyRightYear = new Date().getFullYear();
  public roadmapIndex = 0;
  private roadmapLen = 4;
  private roadmapInterval: Unsubscribable;

  public email = '';
  public canSubscribe = true;
  public isFocus = false;
  public isLoadingEmail = false;

  public swapOptions = {
    path: '/assets/json/swap/data.json',
  };

  public langPageName = 'home';
  private langUnScribe: Unsubscribable;
  private language$: Observable<any>;
  public lang: string;

  public totalData = { pool_tvl: '', total_addresses: '', total_tx_count: '' };

  sourceNews = [
    {
      url: 'https://cointelegraph.com/news/cross-chain-protocol-brings-together-liquidity-sources-from-multiple-networks',
      image: '/assets/images/home/news/1.png',
      title:
        'Cointelegraph: Cross-chain protocol brings together liquidity sources from multiple networks',
      id: 0,
    },
    {
      url: 'https://cryptobriefing.com/o3-swap-cross-chain-dex-aggregator-tomorrows-defi/',
      image: '/assets/images/home/news/2.png',
      title:
        'CryptoBriefing: O3 Swap: A Cross-Chain DEX Aggregator for Tomorrow’s DeFi',
      id: 1,
    },
    {
      url: 'https://www.newsbtc.com/sponsored/o3-swap-redefines-defi-with-improved-efficient-and-economical-cross-chain-crypto-swap-capabilities/',
      image: '/assets/images/home/news/3.png',
      title:
        'NEWSBTC: O3 Swap Redefines DeFi with Improved, Efficient and Economical Cross-Chain Crypto Swap Capabilities',
      id: 2,
    },
    {
      url: 'https://bitcoinist.com/how-o3-swaps-could-become-the-next-hub-for-cross-chain-exchanges/',
      image: '/assets/images/home/news/4.png',
      title:
        'Bitcoinst: How O3 Swaps Could Become The Next Hub For Cross-Chain Exchanges',
      id: 3,
    },
    {
      url: 'https://bscdaily.com/o3-swap-the-game-changer-platform-for-cryptocurrency-based-financial-services/',
      image: '/assets/images/home/news/5.png',
      title:
        'BSC Daily: O3 Swap – The game-changer platform for cryptocurrency-based financial services',
      id: 4,
    },
    {
      url: 'https://www.youtube.com/watch?v=Hc1xFfvqSbM',
      title: `ONE WINNING DECISION THAT CHANGES BOTH EXPERT'S ALTCOIN PORTFOLIO!`,
      id: 5,
    },
    {
      url: 'https://www.youtube.com/watch?v=Oux8MInoDrc',
      title: '【區塊先生】Curve.fi - DeFi 血脈 (293集)',
      id: 6,
    },
    {
      url: 'https://www.youtube.com/watch?v=5JB723BLEwQ',
      title:
        'O3 Swap AMA: The cross-chain protocol that sources liquidity from multiple networks',
      id: 7,
    },
  ];
  displayNews = this.sourceNews.concat(this.sourceNews);
  newsIndex = 0;
  newsLen = this.sourceNews.length + 2;
  private newsInterval: Unsubscribable;
  private newsTimtOut;
  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private apiService: ApiService,
    private commonService: CommonService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }

  ngOnInit(): void {
    this.getTotalData();
    this.roadmapIntervalFun();
    this.newsIntervalFun();
  }

  ngOnDestroy(): void {
    if (this.roadmapInterval) {
      this.roadmapInterval.unsubscribe();
    }
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
    if (this.newsInterval) {
      this.newsInterval.unsubscribe();
    }
  }

  getTotalData(): void {
    this.apiService.getTotalData().subscribe((res: CommonHttpResponse) => {
      if (res.status === 'success') {
        this.totalData = res.data;
      } else {
        this.nzMessage.error(res.error_msg);
      }
    });
  }

  //#region news
  newsIntervalFun(): void {
    if (this.newsInterval) {
      this.newsInterval.unsubscribe();
    }
    this.newsInterval = interval(2000).subscribe(() => {
      this.calcNextNew();
    });
  }
  preNew(): void {
    if (this.newsIndex === 0) {
      return;
    }
    clearTimeout(this.newsTimtOut);
    if (this.newsInterval) {
      this.newsInterval.unsubscribe();
    }
    this.newsIndex = (this.newsIndex - 1) % this.newsLen;
    document
      .getElementById('news-group')
      .setAttribute(
        'style',
        `margin-left: -${this.getItemWidth() * this.newsIndex}px`
      );
    this.newsIntervalFun();
  }
  nextNew(): void {
    clearTimeout(this.newsTimtOut);
    if (this.newsInterval) {
      this.newsInterval.unsubscribe();
    }
    this.calcNextNew();
    this.newsIntervalFun();
  }
  //#endregion

  //#region roadmap
  roadmapIntervalFun(): void {
    if (this.roadmapInterval) {
      this.roadmapInterval.unsubscribe();
    }
    this.roadmapInterval = interval(2000).subscribe(() => {
      this.roadmapIndex = (this.roadmapIndex + 1) % this.roadmapLen;
    });
  }

  enterRoadmap(index: number): void {
    this.roadmapInterval.unsubscribe();
    this.roadmapIndex = index;
  }

  leaveRoadmap(): void {
    this.roadmapIntervalFun();
  }
  //#endregion

  //#region subscript news
  subscriptNews(): void {
    if (this.isLoadingEmail === true) {
      return;
    }
    if (this.checkEmail() === false) {
      this.nzMessage.error(MESSAGE.EnterVaildEmail[this.lang]);
      return;
    }
    this.isLoadingEmail = true;
    this.apiService
      .postEmail(this.email)
      .subscribe((res: CommonHttpResponse) => {
        this.isLoadingEmail = false;
        if (res.status === 'success') {
          this.canSubscribe = false;
        } else {
          this.nzMessage.error(res.error_msg);
        }
      });
  }

  checkEmail(): boolean {
    const regex =
      /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/;
    if (regex.test(this.email)) {
      return true;
    } else {
      return false;
    }
  }
  //#endregion

  changeLang(lang: 'en' | 'zh'): void {
    if (lang === this.lang) {
      return;
    }
    this.lang = lang;
    this.store.dispatch({ type: UPDATE_LANGUAGE, data: lang });
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  }
  //#region private function
  private calcNextNew(): void {
    this.newsIndex = (this.newsIndex + 1) % this.newsLen;
    document
      .getElementById('news-group')
      .setAttribute(
        'style',
        `margin-left: -${this.getItemWidth() * this.newsIndex}px`
      );
    if (this.newsIndex + 1 === this.newsLen) {
      this.newsTimtOut = setTimeout(() => {
        this.newsIndex = 1;
        document
          .getElementById('news-group')
          .setAttribute(
            'style',
            `transition: none; margin-left: -${
              this.getItemWidth() * this.newsIndex
            }px`
          );
      }, 300);
    }
  }
  private getItemWidth(): number {
    if (this.commonService.isMobileWidth()) {
      return document.body.clientWidth * 0.9 + 20;
    } else {
      return 430;
    }
  }
  //#endregion
}

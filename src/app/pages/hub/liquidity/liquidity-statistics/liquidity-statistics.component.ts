import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '@core';
import { ETH_PUSDT_ASSET, Token, USD_TOKENS } from '@lib';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { Unsubscribable, Observable, interval } from 'rxjs';

interface State {
  language: any;
}

@Component({
  selector: 'app-liquidity-statistics',
  templateUrl: './liquidity-statistics.component.html',
  styleUrls: ['./liquidity-statistics.component.scss', './mobile.scss'],
})
export class LiquidityStatisticsComponent implements OnInit, OnDestroy {
  public USDTToken: Token = USD_TOKENS.find(
    (item) => item.symbol.indexOf('USDT') >= 0
  );
  public BUSDToken: Token = USD_TOKENS.find(
    (item) => item.symbol.indexOf('BUSD') >= 0
  );
  public HUSDToken: Token = USD_TOKENS.find(
    (item) => item.symbol.indexOf('HUSD') >= 0
  );

  public langPageName = 'hub';
  private langUnScribe: Unsubscribable;
  private language$: Observable<any>;
  public lang: string;

  public pusdtBalance = {
    ALL: '',
    ETH: { value: '', percentage: '0' },
    BSC: { value: '', percentage: '0' },
    HECO: { value: '', percentage: '0' },
  };
  private getPusdtInterval: Unsubscribable;

  constructor(private store: Store<State>, private apiService: ApiService) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }
  ngOnDestroy(): void {
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
    if (this.getPusdtInterval) {
      this.getPusdtInterval.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.getPusdtBalance();
    this.getPusdtInterval = interval(15000).subscribe(() => {
      this.getPusdtBalance();
    });
  }

  async getPusdtBalance(): Promise<void> {
    this.pusdtBalance.ETH.value = await this.apiService.getPUsdtBalance(
      ETH_PUSDT_ASSET.ETH.assetID,
      ETH_PUSDT_ASSET.ETH.decimals
    );
    this.pusdtBalance.BSC.value = await this.apiService.getPUsdtBalance(
      ETH_PUSDT_ASSET.BSC.assetID,
      ETH_PUSDT_ASSET.BSC.decimals
    );
    this.pusdtBalance.HECO.value = await this.apiService.getPUsdtBalance(
      ETH_PUSDT_ASSET.HECO.assetID,
      ETH_PUSDT_ASSET.HECO.decimals
    );
    this.pusdtBalance.ALL = new BigNumber(this.pusdtBalance.ETH.value)
      .plus(new BigNumber(this.pusdtBalance.BSC.value))
      .plus(new BigNumber(this.pusdtBalance.HECO.value))
      .toFixed();
    this.pusdtBalance.ETH.percentage = new BigNumber(
      this.pusdtBalance.ETH.value
    )
      .dividedBy(new BigNumber(this.pusdtBalance.ALL))
      .times(100)
      .dp(3)
      .toFixed();
    this.pusdtBalance.BSC.percentage = new BigNumber(
      this.pusdtBalance.BSC.value
    )
      .dividedBy(new BigNumber(this.pusdtBalance.ALL))
      .times(100)
      .dp(3)
      .toFixed();
    this.pusdtBalance.HECO.percentage = new BigNumber(
      this.pusdtBalance.HECO.value
    )
      .dividedBy(new BigNumber(this.pusdtBalance.ALL))
      .times(100)
      .dp(3)
      .toFixed();
  }
}

import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SwapService } from '../swap.service';
import { CommonService } from '../common.service';
import {
  NeoWalletName,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEOLINE_NETWORK,
  SwapStateType,
  MESSAGE,
} from '@lib';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { take } from 'rxjs/operators';

interface State {
  swap: SwapStateType;
  language: any;
}

@Injectable()
export class NeolineWalletApiService {
  myWalletName: NeoWalletName = 'NeoLine';
  neolineDapi;
  blockNumberInterval: Unsubscribable;

  swap$: Observable<any>;
  neoWalletName: NeoWalletName;

  language$: Observable<any>;
  lang: string;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService
  ) {
    this.language$ = store.select('language');
    this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.neoWalletName = state.neoWalletName;
    });
    window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
      this.neolineDapi = new (window as any).NEOLine.Init();
    });
  }

  //#region connect
  init(): void {
    const sessionNeoWalletName = sessionStorage.getItem(
      'neoWalletName'
    ) as NeoWalletName;
    if (sessionNeoWalletName !== 'NeoLine') {
      return;
    }
    const autoConnectInterval = interval(1000)
      .pipe(take(5))
      .subscribe(() => {
        if (this.neolineDapi) {
          autoConnectInterval.unsubscribe();
          this.connect(false);
        }
      });
  }

  connect(showMessage = true): Promise<string> {
    if (this.neolineDapi === undefined) {
      this.swapService.toDownloadWallet(this.myWalletName);
      return;
    }
    return this.neolineDapi
      .getAccount()
      .then((result) => {
        if (showMessage) {
          this.nzMessage.success(MESSAGE.ConnectionSucceeded[this.lang]);
        }
        this.commonService.log(result);
        this.swapService.updateAccount(
          'NEO',
          result.address,
          this.myWalletName
        );
        this.addListener();
        this.swapService.getNeoBalances(this.myWalletName);
        this.listenBlockNumber();
        return result.address;
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, this.myWalletName);
      });
  }
  //#endregion

  invoke(params): Promise<any> {
    return this.neolineDapi
      .invoke(params)
      .then(({ txid }) => {
        return txid;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.swapService.handleNeoDapiError(error, this.myWalletName);
      });
  }

  //#region private function
  private listenBlockNumber(): void {
    if (this.blockNumberInterval) {
      return;
    }
    this.blockNumberInterval = interval(15000).subscribe(() => {
      this.swapService.getNeoBalances(this.myWalletName);
      // 没有连接时不获取 balances
      if (this.neoWalletName !== this.myWalletName) {
        this.blockNumberInterval.unsubscribe();
      }
    });
  }
  private addListener(): void {
    window.addEventListener(
      'NEOLine.NEO.EVENT.ACCOUNT_CHANGED',
      (result: any) => {
        this.store.dispatch({
          type: UPDATE_NEO_ACCOUNT,
          data: result.detail.address,
        });
        this.swapService.getNeoBalances(this.myWalletName);
      }
    );
    this.neolineDapi.getNetworks().then((res) => {
      this.store.dispatch({
        type: UPDATE_NEOLINE_NETWORK,
        data: res.defaultNetwork,
      });
    });
    window.addEventListener(
      'NEOLine.NEO.EVENT.NETWORK_CHANGED',
      (result: any) => {
        this.store.dispatch({
          type: UPDATE_NEOLINE_NETWORK,
          data: result.detail.defaultNetwork,
        });
      }
    );
  }
  //#endregion
}

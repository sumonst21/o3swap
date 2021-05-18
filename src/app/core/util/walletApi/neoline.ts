import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SwapService } from '../swap.service';
import { CommonService } from '../common.service';
import {
  NeoWalletName,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEOLINE_NETWORK,
  MESSAGE,
} from '@lib';
import { interval, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

interface State {
  language: any;
}

@Injectable()
export class NeolineWalletApiService {
  private myWalletName: NeoWalletName = 'NeoLine';
  private neolineDapi;

  private language$: Observable<any>;
  private lang: string;

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
    window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
      this.neolineDapi = new (window as any).NEOLine.Init();
    });
  }

  //#region connect
  initConnect(): void {
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
        this.swapService.listenNeoBlockNumber();
        return result.address;
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, this.myWalletName);
      });
  }
  //#endregion

  invoke(params): Promise<any> {
    return new Promise((resolve) => {
      this.neolineDapi
        .invoke(params)
        .then(({ txid }) => {
          resolve(txid);
        })
        .catch((error) => {
          this.commonService.log(error);
          this.swapService.handleNeoDapiError(error, this.myWalletName);
          resolve(undefined);
        });
    });
  }

  //#region private function
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

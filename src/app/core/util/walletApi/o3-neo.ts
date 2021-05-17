import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import { NeoWalletName, MESSAGE } from '@lib';
import { Observable } from 'rxjs';
interface State {
  language: any;
}
@Injectable()
export class O3NeoWalletApiService {
  private myWalletName: NeoWalletName = 'O3';
  private o3DapiIsReady = false;

  private language$: Observable<any>;
  private lang: string;

  constructor(
    store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService
  ) {
    this.language$ = store.select('language');
    this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    o3dapi.initPlugins([o3dapiNeo]);
    o3dapi.NEO.addEventListener(o3dapi.NEO.Constants.EventName.READY, () => {
      this.o3DapiIsReady = true;
    });
  }

  //#region connect
  connect(): Promise<string> {
    if (this.o3DapiIsReady === false) {
      this.nzMessage.info(MESSAGE.O3DAPINotReady[this.lang]);
    }
    return o3dapi.NEO.getAccount()
      .then((result) => {
        this.commonService.log(result);
        if (!result.address) {
          return;
        }
        this.nzMessage.success(MESSAGE.ConnectionSucceeded[this.lang]);
        this.swapService.updateAccount(
          'NEO',
          result.address,
          this.myWalletName
        );
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
      o3dapi.NEO.invoke(params)
        .then(({ txid }) => {
          resolve(txid);
        })
        .catch((error) => {
          this.commonService.log(error);
          this.swapService.handleNeoDapiError(error, this.myWalletName);
        });
    });
  }
}

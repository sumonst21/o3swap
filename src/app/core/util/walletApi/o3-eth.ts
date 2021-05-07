import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import o3dapi from 'o3-dapi-core';
import { ETH, BSC, HECO } from 'o3-dapi-eth';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import { SwapStateType, EthWalletName, CHAINS, MESSAGE } from '@lib';
import { Unsubscribable, Observable, interval } from 'rxjs';

interface State {
  swap: SwapStateType;
  language: any;
}

@Injectable()
export class O3EthWalletApiService {
  private myWalletName: EthWalletName = 'O3';
  private blockNumberInterval: Unsubscribable;
  public isMobileO3Wallet = false;

  private swap$: Observable<any>;
  private walletName = { ETH: '', BSC: '', HECO: '' };

  private language$: Observable<any>;
  private lang: string;

  constructor(
    store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService
  ) {
    o3dapi.initPlugins([ETH]);
    o3dapi.initPlugins([BSC]);
    o3dapi.initPlugins([HECO]);
    this.language$ = store.select('language');
    this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.walletName.ETH = state.ethWalletName;
      this.walletName.BSC = state.bscWalletName;
      this.walletName.HECO = state.hecoWalletName;
    });
    if ((window as any).ethereum) {
      this.isMobileO3Wallet = (window as any).ethereum.isO3Wallet || false;
    }
  }

  connect(chain: string): Promise<string> {
    return o3dapi[chain]
      .request({ method: 'eth_requestAccounts' })
      .then((response) => {
        let address: string;
        if (response.result) {
          const addressArr = response.result;
          if (addressArr.length <= 0) {
            return;
          }
          address = addressArr[0];
        } else {
          if (response.length <= 0) {
            return;
          }
          address = response[0].address;
        }
        this.nzMessage.success(MESSAGE.ConnectionSucceeded[this.lang]);
        this.walletName[chain] = this.myWalletName;
        this.listenBlockNumber();
        this.swapService.getBalance(chain as CHAINS, false, address);
        this.swapService.updateAccount(chain, address, this.myWalletName);
        return address;
      })
      .catch((error) => {
        this.swapService.handleEthDapiError(error, this.myWalletName);
      });
  }

  checkNetwork(): boolean {
    return true;
  }

  sendTransaction(data, chain?: CHAINS): Promise<any> {
    return o3dapi[chain]
      .request(data)
      .then((hash) => {
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.swapService.handleEthDapiError(error, this.myWalletName);
      });
  }

  //#region private function
  private listenBlockNumber(): void {
    if (this.blockNumberInterval) {
      return;
    }
    this.blockNumberInterval = interval(15000).subscribe(() => {
      this.swapService.getBalance('ETH');
      this.swapService.getBalance('BSC');
      this.swapService.getBalance('HECO');
      // 没有连接时不获取 balances
      if (
        this.walletName.ETH !== 'O3' &&
        this.walletName.BSC !== 'O3' &&
        this.walletName.HECO !== 'O3'
      ) {
        this.blockNumberInterval.unsubscribe();
      }
    });
  }
  //#endregion
}

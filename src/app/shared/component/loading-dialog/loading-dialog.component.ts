import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
} from '@angular/core';
import { MESSAGE, SwapTransactionType } from '@lib';
import { Store } from '@ngrx/store';
import { AnimationOptions } from 'ngx-lottie';
import { Observable } from 'rxjs/internal/Observable';
import { VaultTransactionType } from 'src/app/_lib/vault';

interface State {
  rates: any;
  language: any;
}

interface State {
  language: any;
}

@Component({
  selector: 'app-loading-dialog',
  templateUrl: './loading-dialog.component.html',
  styleUrls: ['./loading-dialog.component.scss'],
})
export class LoadingDialogComponent implements OnInit, OnDestroy {
  @Input() transactionType: any;
  @Input() params: any;
  @Output() closeThis = new EventEmitter();

  message = '';

  private language$: Observable<any>;
  private lang: string;

  loadingOptions: AnimationOptions = {
    path: '/assets/json/loading.json',
    loop: true,
  };

  constructor(private store: Store<State>) {
    this.language$ = store.select('language');
    this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }

  ngOnInit(): void {
    switch (this.transactionType) {
      case SwapTransactionType.approve:
        this.message = MESSAGE.Approve[this.lang];
        break;
      case SwapTransactionType.deposit:
        this.message = `${MESSAGE.Deposit[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        } for ${this.params.value2} ${this.params.symbol2}`;
        break;
      case SwapTransactionType.swap:
        this.message = `${MESSAGE.Swap[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        } for ${this.params.value2} ${this.params.symbol2}`;
        break;
      case SwapTransactionType.withdraw:
        this.message = `${MESSAGE.Withdraw[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        } for ${this.params.value2} ${this.params.symbol2}`;
        break;
      case VaultTransactionType.approve:
        this.message = MESSAGE.Approve[this.lang];
        break;
      case VaultTransactionType.claim:
        this.message = `${MESSAGE.Claim[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        }`;
        break;
      case VaultTransactionType.stake:
        this.message = `${MESSAGE.Stake[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        }`;
        break;
      case VaultTransactionType.unstake:
        this.message = `${MESSAGE.Unstake[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        }`;
        break;
      default:
        this.message = '';
        break;
    }
  }

  ngOnDestroy(): void {}

  close(): void {
    this.closeThis.emit();
  }
}

import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
} from '@angular/core';
import { MESSAGE, TransactionType } from '@lib';
import { Store } from '@ngrx/store';
import { AnimationOptions } from 'ngx-lottie';
import { Observable } from 'rxjs/internal/Observable';

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
      case TransactionType.approve:
        this.message = MESSAGE.Approve[this.lang];
        break;
      case TransactionType.deposit:
        this.message = `${MESSAGE.Deposit[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        } for ${this.params.value2} ${this.params.symbol2}`;
        break;
      case TransactionType.swap:
        this.message = `${MESSAGE.Swap[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        } for ${this.params.value2} ${this.params.symbol2}`;
        break;
      case TransactionType.withdraw:
        this.message = `${MESSAGE.Withdraw[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        } for ${this.params.value2} ${this.params.symbol2}`;
        break;
      case TransactionType.claim:
        this.message = `${MESSAGE.Claim[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        }`;
        break;
      case TransactionType.stake:
        this.message = `${MESSAGE.Stake[this.lang]} ${this.params.value1} ${
          this.params.symbol1
        }`;
        break;
      case TransactionType.unstake:
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

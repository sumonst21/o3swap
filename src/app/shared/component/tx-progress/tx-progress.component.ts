import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  TX_PAGES_PREFIX,
  POLY_TX_PAGES_PREFIX,
  MyTransaction,
  TransactionType,
  MESSAGE,
} from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnimationOptions } from 'ngx-lottie';
import { Observable, Unsubscribable } from 'rxjs';
import { CommonService } from 'src/app/core/util/common.service';

interface State {
  language: any;
}
@Component({
  selector: 'app-tx-progress',
  templateUrl: './tx-progress.component.html',
  styleUrls: ['./tx-progress.component.scss'],
})
export class TxProgressComponent implements OnInit, OnDestroy {
  @Input() transaction: MyTransaction;
  @Output() closeThis = new EventEmitter();
  TX_PAGES_PREFIX = TX_PAGES_PREFIX;
  POLY_TX_PAGES_PREFIX = POLY_TX_PAGES_PREFIX;
  TransactionType = TransactionType;
  successOptions: AnimationOptions = {
    path: '/assets/json/success.json',
    loop: false,
  };
  pendingOptions = {
    path: '/assets/json/pending.json',
  };
  txCompleteOptions = {
    path: '/assets/json/tx-complete.json',
    loop: false,
  };
  txPendingOptions = {
    path: '/assets/json/tx-waiting.json',
  };

  showTxDetail = false;
  swapProgress = 20;

  langPageName = 'swap';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    public store: Store<State>,
    private nzMessage: NzMessageService,
    // private commonService: CommonService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  handleTxProgress(): number {
    if (this.transaction.isPending === false) {
      this.swapProgress = 100;
    } else {
      if (this.transaction.progress) {
        if (this.transaction.progress.step3.status === 2) {
          this.swapProgress = 100;
        } else if (this.transaction.progress.step2.status === 2) {
          this.swapProgress = 66;
        } else if (this.transaction.progress.step1.status === 2) {
          this.swapProgress = 33;
        } else {
          this.swapProgress = 20;
        }
      } else {
        this.swapProgress = 20;
      }
    }
    return this.swapProgress;
  }

  copy(hash: string): void {
    // this.commonService.copy(hash);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.setAttribute('value', hash);
    input.select();
    if (document.execCommand('copy')) {
      document.execCommand('copy');
      this.nzMessage.success(MESSAGE.CopiedSuccessfully[this.lang]);
    }
    document.body.removeChild(input);
  }

  close(): void {
    this.closeThis.emit();
  }
}

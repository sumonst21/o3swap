import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Token, TxAtPage } from '@lib';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { EthApiService } from '@core';
import { Store } from '@ngrx/store';

interface State {
  language: any;
}

@Component({
  selector: 'app-approve',
  templateUrl: './approve.component.html',
  styleUrls: ['./approve.component.scss'],
})
export class ApproveComponent implements OnInit, OnDestroy {
  @Input() aggregator?: string;
  @Input() spender?: string;
  @Input() fromToken: Token;
  @Input() fromAddress: string;
  @Input() walletName: string;
  @Input() txAtPage: TxAtPage;
  @Output() closeThis = new EventEmitter();

  isApproveLoading = false;

  langPageName = 'app';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private store: Store<State>,
    private ethApiService: EthApiService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }
  ngOnDestroy(): void {
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  ngOnInit(): void {}

  approve(): void {
    this.isApproveLoading = true;
    this.ethApiService
      .approve(
        this.txAtPage,
        this.fromToken,
        this.fromAddress,
        this.aggregator,
        this.spender
      )
      .then((hash) => {
        if (hash) {
          this.close();
        } else {
          this.isApproveLoading = false;
        }
      });
  }

  close(): void {
    this.closeThis.emit();
  }
}

import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonService } from '@core';
import {
  TX_PAGES_PREFIX,
  MyTransaction,
  TransactionType,
  CLEAR_ALL_TXS,
} from '@lib';
import { Store } from '@ngrx/store';
import { Observable, Unsubscribable } from 'rxjs';

interface State {
  language: any;
  app: any;
}
@Component({
  selector: 'app-tx-list',
  templateUrl: './tx-list.component.html',
  styleUrls: ['./tx-list.component.scss'],
})
export class TxListComponent implements OnInit, OnDestroy {
  @Output() closeThis = new EventEmitter();
  public TX_PAGES_PREFIX = TX_PAGES_PREFIX;
  public TransactionType = TransactionType;
  public pendingMinOptions = {
    path: '/assets/json/pending-min.json',
  };
  public showList = false;
  public showDrawer = false;

  private appUnScribe: Unsubscribable;
  private app$: Observable<any>;
  public transactions: MyTransaction[] = [];

  public langPageName = 'app';
  private langUnScribe: Unsubscribable;
  private language$: Observable<any>;
  public lang: string;

  constructor(
    public store: Store<State>,
    private commonService: CommonService
  ) {
    this.language$ = store.select('language');
    this.app$ = store.select('app');
  }

  ngOnInit(): void {
    if (this.commonService.isMobileWidth()) {
      this.showDrawer = true;
    }
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.appUnScribe = this.app$.subscribe((state) => {
      this.transactions = state.transactions;
    });
  }

  ngOnDestroy(): void {
    if (this.appUnScribe) {
      this.appUnScribe.unsubscribe();
    }
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  copy(e, hash: string): void {
    e.stopPropagation();
    this.commonService.copy(hash);
  }

  showTxDetail(txItem: MyTransaction): void {
    this.commonService.showTxDetail(txItem);
  }

  clearAll(): void {
    this.transactions = [];
    this.store.dispatch({ type: CLEAR_ALL_TXS });
  }

  stopPropagation(e): void {
    e.stopPropagation();
  }

  close(): void {
    this.closeThis.emit();
  }
}

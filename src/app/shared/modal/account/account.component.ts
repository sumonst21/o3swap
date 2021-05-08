import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonService } from '@core';
import { CHAINS } from '@lib';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}
@Component({
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit, OnDestroy {
  @Input() chain: CHAINS;
  @Input() walletName: string;
  @Input() accountAddress: string;

  langPageName = 'app';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private commonService: CommonService,
    private store: Store<State>,
    private modal: NzModalRef
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

  copy(value: string): void {
    this.commonService.copy(value);
  }

  toDisConnect(): void {
    this.modal.close('disconnect');
  }

  toChangeWallet(): void {
    this.modal.close('change');
  }

  close(): void {
    this.modal.close();
  }
}

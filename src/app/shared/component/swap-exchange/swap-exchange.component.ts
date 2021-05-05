import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Token, AssetQueryResponse } from '@lib';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}

@Component({
  selector: 'app-swap-exchange',
  templateUrl: './swap-exchange.component.html',
  styleUrls: ['./swap-exchange.component.scss'],
})
export class SwapExchangeComponent implements OnInit, OnDestroy {
  @Input() chooseSwapPathIndex: number;
  @Input() receiveSwapPathArray: AssetQueryResponse;
  @Output() closeThis = new EventEmitter();

  TOKENS: Token[] = []; // 所有的 tokens

  toTokenSymbol: string;

  langPageName = 'swap';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(private store: Store<State>) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }

  ngOnInit(): void {
    const swapPath = this.receiveSwapPathArray[0].swapPath;
    this.toTokenSymbol = swapPath[swapPath.length - 1];
  }

  ngOnDestroy(): void {
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  changeSwapPath(index: number): void {
    this.closeThis.emit(index);
  }

  close(): void {
    this.closeThis.emit();
  }
}

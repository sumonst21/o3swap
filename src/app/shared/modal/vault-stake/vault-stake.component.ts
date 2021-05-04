import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { SwapStateType } from '@lib';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { CommonService } from '@core';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  swap: SwapStateType;
  language: any;
}

@Component({
  templateUrl: './vault-stake.component.html',
  styleUrls: ['./vault-stake.component.scss'],
})
export class VaultStakeComponent implements OnInit, OnDestroy {
  @Input() inputAmount: number = 0;

  langPageName = 'vault-stake';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private store: Store<State>,
    private changeDetectorRef: ChangeDetectorRef,
    private modal: NzModalRef,
    private commonService: CommonService
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

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
  }

  close(): void {
    this.modal.close();
  }
}

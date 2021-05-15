import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import { MESSAGE, SwapStateType, Token } from '@lib';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  swap: SwapStateType;
  language: any;
}

@Component({
  selector: 'app-vault-stake',
  templateUrl: './vault-stake.component.html',
  styleUrls: ['./vault-stake.component.scss'],
})
export class VaultStakeComponent implements OnInit, OnDestroy {
  @Input() balance = '0';
  @Input() isStake = true;
  @Input() token: Token;
  @Input() recommendStakeLp?: string;
  @Output() closeThis = new EventEmitter();

  inputAmount = '';

  langPageName = 'vault';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(store: Store<State>, private nzMessage: NzMessageService) {
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

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
  }

  close(): void {
    this.closeThis.emit();
  }
  confirm(): void {
    const inputNumber = new BigNumber(this.inputAmount);
    const balanceNumber = new BigNumber(this.balance);
    if (inputNumber.isNaN() || inputNumber.isZero()) {
      this.nzMessage.error(MESSAGE.WrongInput[this.lang]);
      return;
    }
    if (inputNumber.comparedTo(balanceNumber) === 1) {
      this.nzMessage.error(MESSAGE.InsufficientBalance[this.lang]);
      return;
    }
    this.closeThis.emit(this.inputAmount);
  }
}

import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import { SwapStateType, Token } from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  swap: SwapStateType;
  language: any;
}

@Component({
  selector: 'app-vault-unlock-calculator',
  templateUrl: './vault-unlock-calculator.component.html',
  styleUrls: ['./vault-unlock-calculator.component.scss'],
})
export class VaultUnlockCalculatorComponent implements OnInit, OnDestroy {
  @Input() LPToken: Token;
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
  confirm(): void {}
}

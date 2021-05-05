import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import { SwapStateType, Token } from '@lib';
import { Store } from '@ngrx/store';
import { CommonService } from '@core';
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
  langPageName = 'vault';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;
  @Input() balance = '0';
  @Input() isStake = true;
  @Input() token: Token;
  @Output() closeThis = new EventEmitter();
  inputAmount = '';
  constructor(
    private store: Store<State>,
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
    this.closeThis.emit();
  }
  confirm(): void {
    this.closeThis.emit(this.inputAmount);
  }
}

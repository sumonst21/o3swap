import { Component, Input, OnInit } from '@angular/core';
import { Token } from '@lib';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  templateUrl: './swap-token.component.html',
})
export class SwapTokenModalComponent implements OnInit {
  @Input() isFrom: boolean;
  @Input() fromToken: Token;
  @Input() toToken: Token;

  constructor(private modal: NzModalRef) {}
  ngOnInit(): void {}

  close($event): void {
    this.modal.close($event);
  }
}

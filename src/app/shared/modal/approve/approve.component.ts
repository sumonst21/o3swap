import { Component, Input, OnInit } from '@angular/core';
import { Token, TxAtPage } from '@lib';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  templateUrl: './approve.component.html',
})
export class ApproveModalComponent implements OnInit {
  @Input() aggregator?: string;
  @Input() spender?: string;
  @Input() fromToken: Token;
  @Input() fromAddress: string;
  @Input() walletName: string;
  @Input() txAtPage: TxAtPage;

  constructor(private modal: NzModalRef) {}

  ngOnInit(): void {}

  close(): void {
    this.modal.close();
  }
}

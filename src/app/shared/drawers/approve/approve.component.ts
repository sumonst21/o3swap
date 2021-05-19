import { Component, Input, OnInit } from '@angular/core';
import { Token, TxAtPage } from '@lib';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  templateUrl: './approve.component.html',
})
export class ApproveDrawerComponent implements OnInit {
  @Input() aggregator?: string;
  @Input() spender?: string;
  @Input() fromToken: Token;
  @Input() fromAddress: string;
  @Input() walletName: string;
  @Input() txAtPage: TxAtPage;

  constructor(private drawerRef: NzDrawerRef) {}

  ngOnInit(): void {}

  close(): void {
    this.drawerRef.close();
  }
}

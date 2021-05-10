import { Component, Input, OnInit } from '@angular/core';
import { AssetQueryResponse } from '@lib';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  templateUrl: './swap-exchange.component.html',
})
export class SwapExchangeDrawerComponent implements OnInit {
  @Input() chooseSwapPathIndex: number;
  @Input() receiveSwapPathArray: AssetQueryResponse;

  constructor(private drawerRef: NzDrawerRef) {}

  ngOnInit(): void {}

  close($event): void {
    this.drawerRef.close($event);
  }
}

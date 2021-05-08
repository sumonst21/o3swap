import { Component, Input, OnInit } from '@angular/core';
import { AssetQueryResponse } from '@lib';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  templateUrl: './swap-exchange.component.html',
})
export class SwapExchangeModalComponent implements OnInit {
  @Input() chooseSwapPathIndex: number;
  @Input() receiveSwapPathArray: AssetQueryResponse;

  constructor(private modal: NzModalRef) {}

  ngOnInit(): void {}

  close($event): void {
    this.modal.close($event);
  }
}

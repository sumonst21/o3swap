import { Component, Input, OnInit } from '@angular/core';
import { MyTransaction } from '@lib';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  templateUrl: './tx-progress.component.html',
})
export class TxProgressDrawerComponent implements OnInit {
  @Input() transaction: MyTransaction;

  constructor(private drawerRef: NzDrawerRef) {}

  ngOnInit(): void {}

  close($event): void {
    this.drawerRef.close($event);
  }
}

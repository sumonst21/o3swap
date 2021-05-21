import { Component, Input, OnInit } from '@angular/core';
import { MyTransaction } from '@lib';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  templateUrl: './tx-progress.component.html',
})
export class TxProgressModalComponent implements OnInit {
  @Input() transaction: MyTransaction;

  constructor(private modal: NzModalRef) {}

  ngOnInit(): void {}

  close($event): void {
    this.modal.close($event);
  }
}

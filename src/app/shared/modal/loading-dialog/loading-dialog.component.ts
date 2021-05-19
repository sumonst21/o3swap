import { Component, Input, OnInit } from '@angular/core';
import { Token } from '@lib';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  templateUrl: './loading-dialog.component.html',
})
export class LoadingDialogModalComponent implements OnInit {
  @Input() transactionType: any;
  @Input() params: any;
  constructor(private modal: NzModalRef) {}

  ngOnInit(): void {}

  close($event): void {
    this.modal.close($event);
  }
}

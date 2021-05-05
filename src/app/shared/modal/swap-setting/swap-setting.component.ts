import { Component, OnInit } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  templateUrl: './swap-setting.component.html',
})
export class SwapSettingModalComponent implements OnInit {
  constructor(private modal: NzModalRef) {}

  ngOnInit(): void {}

  close(): void {
    this.modal.close();
  }
}

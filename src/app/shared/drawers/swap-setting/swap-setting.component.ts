import { Component, OnInit } from '@angular/core';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  templateUrl: './swap-setting.component.html',
})
export class SwapSettingDrawerComponent implements OnInit {
  constructor(private drawerRef: NzDrawerRef) {}

  ngOnInit(): void {}

  close(): void {
    this.drawerRef.close();
  }
}

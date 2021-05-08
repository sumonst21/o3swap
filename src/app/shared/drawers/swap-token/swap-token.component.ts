import { Component, Input, OnInit } from '@angular/core';
import { Token } from '@lib';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  templateUrl: './swap-token.component.html',
})
export class SwapTokenDrawerComponent implements OnInit {
  @Input() isFrom: boolean;
  @Input() fromToken: Token;
  @Input() toToken: Token;

  constructor(private drawerRef: NzDrawerRef) {}
  ngOnInit(): void {}

  close($event): void {
    this.drawerRef.close($event);
  }
}

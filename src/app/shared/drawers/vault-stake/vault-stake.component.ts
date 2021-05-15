import { Component, Input, OnInit } from '@angular/core';
import { Token } from '@lib';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  templateUrl: './vault-stake.component.html',
})
export class VaultStakeDrawerComponent implements OnInit {
  @Input() balance = '0';
  @Input() isStake = true;
  @Input() token: Token;
  @Input() recommendStakeLp: string;

  constructor(private drawerRef: NzDrawerRef) {}

  ngOnInit(): void {}

  close($event): void {
    this.drawerRef.close($event);
  }
}

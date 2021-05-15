import { Component, Input, OnInit } from '@angular/core';
import { Token } from '@lib';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  templateUrl: './vault-stake.component.html',
})
export class VaultStakeModalComponent implements OnInit {
  @Input() balance = '0';
  @Input() isStake = true;
  @Input() token: Token;
  @Input() recommendStakeLp: string;

  constructor(private modal: NzModalRef) {}

  ngOnInit(): void {}

  close($event): void {
    this.modal.close($event);
  }
}

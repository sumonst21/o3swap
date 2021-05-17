import { Component, Input, OnInit } from '@angular/core';
import { Token } from '@lib';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  templateUrl: './vault-unlock-calculator.component.html',
})
export class VaultUnlockCalculatorModalComponent implements OnInit {
  @Input() LPToken: Token;

  constructor(private modal: NzModalRef) {}

  ngOnInit(): void {}

  close($event): void {
    this.modal.close($event);
  }
}

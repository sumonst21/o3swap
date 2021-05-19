import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
} from '@angular/core';
import { SwapTransactionType } from '@lib';
import { AnimationOptions } from 'ngx-lottie';
import { VaultTransactionType } from 'src/app/_lib/vault';

interface State {
  rates: any;
  language: any;
}

@Component({
  selector: 'app-loading-dialog',
  templateUrl: './loading-dialog.component.html',
  styleUrls: ['./loading-dialog.component.scss'],
})
export class LoadingDialogComponent implements OnInit, OnDestroy {
  @Input() transactionType: any;
  @Input() params: any;
  @Output() closeThis = new EventEmitter();

  message = '';

  loadingOptions: AnimationOptions = {
    path: '/assets/json/loading.json',
    loop: true,
  };

  ngOnInit(): void {
    switch (this.transactionType) {
      case SwapTransactionType.approve:
        this.message = 'Approving';
        break;
      case SwapTransactionType.deposit:
        this.message = 'Deposit';
        break;
      case SwapTransactionType.swap:
        this.message = 'Swap';
        break;
      case SwapTransactionType.withdraw:
        this.message = 'withdraw';
        break;
      case VaultTransactionType.approve:
        this.message = 'Approving';
        break;
      case VaultTransactionType.claim:
        this.message = 'Claim';
        break;
      case VaultTransactionType.stake:
        this.message = 'Stake';
        break;
      case VaultTransactionType.unstake:
        this.message = 'Unstake';
        break;
      default:
        this.message = '';
        break;
    }
  }

  ngOnDestroy(): void {}

  close(): void {}
}

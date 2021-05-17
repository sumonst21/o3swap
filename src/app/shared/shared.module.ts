import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { LoadingComponent } from './component/loading/loading.component';
import { TxProgressComponent } from './component/tx-progress/tx-progress.component';
import { LongBalanceComponent } from './component/long-balance/long-balance.component';
import { ExchartLiquidfillComponent } from './component/echarts-liquidfill/echarts-liquidfill.component';
import {
  HeaderConnectComponent,
  HeaderConnectItemComponent,
  WalletConnectComponent,
  WalletConnectItemComponent,
  VaultWalletConnectComponent,
  VaultHeaderConnectComponent,
} from './component/header';
import { SwapTokenComponent } from './component/swap-token/swap-token.component';
import { ApproveComponent } from './component/approve/approve.component';
import { SwapExchangeComponent } from './component/swap-exchange/swap-exchange.component';
import { SwapSettingComponent } from './component/swap-setting/swap-setting.component';
import { VaultStakeComponent } from './component/vault-stake/vault-stake.component';

import { HubTokenComponent } from './drawers/hub-token/hub-token.component';
import { SwapTokenDrawerComponent } from './drawers/swap-token/swap-token.component';
import { ApproveDrawerComponent } from './drawers/approve/approve.component';
import { SwapExchangeDrawerComponent } from './drawers/swap-exchange/swap-exchange.component';
import { SwapSettingDrawerComponent } from './drawers/swap-setting/swap-setting.component';
import { VaultStakeDrawerComponent } from './drawers/vault-stake/vault-stake.component';

import { SwapSettingModalComponent } from './modal/swap-setting/swap-setting.component';
import { SwapExchangeModalComponent } from './modal/swap-exchange/swap-exchange.component';
import { SwapTokenModalComponent } from './modal/swap-token/swap-token.component';
import { VaultStakeModalComponent } from './modal/vault-stake/vault-stake.component';
import { ApproveModalComponent } from './modal/approve/approve.component';
import { RiskWarningComponent } from './modal/risk-warning/risk-warning.component';
import { AccountComponent } from './modal/account/account.component';

import { ShortAddressPipe } from './pipes/short-address.pipe';
import { TransNumberPipe } from './pipes/trans-number.pipe';
import { TranslatePipe } from './pipes/translate.pipe';

import { ErrSrcDirective } from './directive/err-src.directive';
import { IframeTrackerDirective } from './directive/iframe-tracker.directive';

import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzElementPatchModule } from 'ng-zorro-antd/core/element-patch';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { LottieModule } from 'ngx-lottie';
import { NgxEchartsModule } from 'ngx-echarts';
import { NzTableModule } from 'ng-zorro-antd/table';
import { VaultUnlockCalculatorComponent } from './component/vault-unlock-calculator/vault-unlock-calculator.component';
import { VaultUnlockCalculatorModalComponent } from './modal/vault-unlock-calculator/vault-unlock-calculator.component';

const COMPONENTS = [
  LoadingComponent,
  TxProgressComponent,
  ExchartLiquidfillComponent,
  HeaderConnectComponent,
  HeaderConnectItemComponent,
  WalletConnectComponent,
  WalletConnectItemComponent,
  VaultWalletConnectComponent,
  VaultHeaderConnectComponent,
  LongBalanceComponent,
  RiskWarningComponent,
  HubTokenComponent,
  SwapTokenComponent,
  SwapTokenDrawerComponent,
  SwapTokenModalComponent,
  SwapSettingComponent,
  SwapSettingDrawerComponent,
  SwapSettingModalComponent,
  SwapExchangeComponent,
  SwapExchangeDrawerComponent,
  SwapExchangeModalComponent,
  VaultStakeComponent,
  VaultUnlockCalculatorComponent,
  VaultStakeDrawerComponent,
  VaultStakeModalComponent,
  VaultUnlockCalculatorModalComponent,
  ApproveComponent,
  ApproveDrawerComponent,
  ApproveModalComponent,
  AccountComponent,
];
const PIPES = [ShortAddressPipe, TransNumberPipe, TranslatePipe];
const DIRECTIVES = [ErrSrcDirective, IframeTrackerDirective];
const THIRD_MODULES = [
  NzNotificationModule,
  NzMessageModule,
  NzToolTipModule,
  NzButtonModule,
  NzModalModule,
  NzProgressModule,
  NzDropDownModule,
  NzDrawerModule,
  LottieModule,
  NgxEchartsModule,
  NzElementPatchModule,
  NzTableModule,
];

@NgModule({
  declarations: [...PIPES, ...COMPONENTS, ...DIRECTIVES],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ...THIRD_MODULES],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...PIPES,
    ...THIRD_MODULES,
    ...COMPONENTS,
    ...DIRECTIVES,
  ],
})
export class SharedModule {}

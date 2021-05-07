import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  CommonService,
  MetaMaskWalletApiService,
  VaultdMetaMaskWalletApiService,
} from '@core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Unsubscribable, Observable, interval } from 'rxjs';
import {
  ApproveModalComponent,
  ApproveDrawerComponent,
  VaultStakeDrawerComponent,
  VaultStakeModalComponent,
} from '@shared';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { O3STAKING_CONTRACT, O3TOKEN_CONTRACT, O3_TOKEN, Token } from '@lib';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
interface State {
  language: any;
}
interface State {
  vault: any;
}
@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss', './mobile.scss'],
})
export class VaultComponent implements OnInit, OnDestroy {
  langPageName = 'vault';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;
  isMobile = false;
  vault$: Observable<any>;
  vaultUnScribe: Unsubscribable;

  o3Locked = '--';
  o3Available = '--';
  o3Total = '--';

  totalProfit = '--';
  stakeUnlockTokenList: any[] = [
    {
      assetID: '0xd5d63dce45e0275ca76a8b2e9bd8c11679a57d0d',
      symbol: 'LP',
      decimals: 18,
      amount: '0',
      chain: 'ETH',
      logo: '/assets/images/tokens/lp-eth.png',
    },
  ];
  o3StakingTokenList: any[] = [O3_TOKEN];
  lpstakingTokenList: any[] = [
    {
      assetID: '0xd5d63dce45e0275ca76a8b2e9bd8c11679a57d0d',
      symbol: 'LP',
      decimals: 18,
      amount: '0',
      chain: 'ETH',
      logo: '/assets/images/tokens/lp-eth.png',
    },
  ];
  constructor(
    private store: Store<State>,
    private modal: NzModalService,
    private nzMessage: NzMessageService,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private vaultdMetaMaskWalletApiService: VaultdMetaMaskWalletApiService,
    private drawerService: NzDrawerService,
    private commonService: CommonService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.vault$ = store.select('vault');
  }

  ngOnInit(): void {
    this.vaultUnScribe = this.vault$.subscribe((state) => {
      this.initO3Data();
    });
    interval(5000).subscribe(() => {
      if (this.vaultdMetaMaskWalletApiService.vaultWallet) {
        this.initO3Data();
      }
    });
    if (this.commonService.isMobileWidth()) {
      this.isMobile = true;
    }
  }
  ngOnDestroy(): void {
    if (this.vaultUnScribe) {
      this.vaultUnScribe.unsubscribe();
    }
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  async initO3Data(): Promise<void> {
    // head data
    Promise.all([
      this.vaultdMetaMaskWalletApiService.getLockedOf() || '--',
      this.vaultdMetaMaskWalletApiService.getUnlockedOf() || '--',
    ]).then((res) => {
      [this.o3Locked, this.o3Available] = res;
      const totleNum = new BigNumber(this.o3Locked).plus(
        new BigNumber(this.o3Available)
      );
      if (!totleNum.isNaN()) {
        this.o3Total = totleNum.toFixed();
      } else {
        this.o3Total = '--';
      }
    });
    // unlock zoon
    this.stakeUnlockTokenList.forEach(async (item: any) => {
      Promise.all([
        this.vaultdMetaMaskWalletApiService.getStaked(item) || '--',
        this.metaMaskWalletApiService.getBalancByHash(item) || '--',
        this.vaultdMetaMaskWalletApiService.claimableUnlocked(item) || '--',
        this.vaultdMetaMaskWalletApiService.getUnlockSpeed(item) || '--',
      ]).then((res) => {
        [item.staked, item.remaining, item.claimable, item.speed] = res;
      });
    });
    // o3 Staking
    this.o3StakingTokenList.forEach(async (item: any) => {
      Promise.all([
        this.metaMaskWalletApiService.getBalancByHash(item) || '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingTotalStaing(item) ||
          '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingStaked(item) || '--',
      ]).then((res) => {
        [item.balance, item.totalStaking, item.staked] = res;
      });
    });
    // lp staking
    this.lpstakingTokenList.forEach(async (item: any) => {
      Promise.all([
        this.metaMaskWalletApiService.getBalancByHash(item) || '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingTotalStaing(item) ||
          '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingStaked(item) || '--',
      ]).then((res) => {
        [item.balance, item.totalStaking, item.staked] = res;
      });
    });
    let tempTotalProfit = new BigNumber('0');
    const earnO3TokenList = this.lpstakingTokenList.concat(
      this.o3StakingTokenList
    );
    for (const [index, item] of earnO3TokenList.entries()) {
      item.profit =
        (await this.vaultdMetaMaskWalletApiService.getO3StakingTotalProfit(
          item
        )) || '--';
      tempTotalProfit = new BigNumber(tempTotalProfit)
        .plus(new BigNumber(item.profit))
        .dp(18);
      if (
        (index === earnO3TokenList.length - 1 || this.totalProfit === '--') &&
        !tempTotalProfit.isNaN()
      ) {
        this.totalProfit = tempTotalProfit.toFixed() || '--';
      }
    }
  }

  async showUnlockStake(
    token: Token,
    balance: string,
    isStake: boolean = true
  ): Promise<void> {
    let modal;
    if (!this.commonService.isMobileWidth()) {
      modal = this.modal.create({
        nzContent: VaultStakeModalComponent,
        nzFooter: null,
        nzTitle: null,
        nzClosable: false,
        nzClassName: 'custom-modal custom-stake-modal',
        nzComponentParams: {
          token,
          balance,
          isStake,
        },
      });
    } else {
      modal = this.drawerService.create({
        nzContent: VaultStakeDrawerComponent,
        nzTitle: null,
        nzClosable: false,
        nzPlacement: 'bottom',
        nzWrapClassName: 'custom-drawer',
        nzContentParams: {
          token,
          balance,
          isStake,
        },
      });
    }
    modal.afterClose.subscribe(async (res) => {
      if (res) {
        const showApprove = await this.checkShowApprove(
          token,
          this.vaultdMetaMaskWalletApiService.vaultWallet.address,
          res,
          O3TOKEN_CONTRACT
        );
        if (showApprove === true) {
          this.showApproveModal(token, O3TOKEN_CONTRACT);
          return;
        }
        if (isStake) {
          this.vaultdMetaMaskWalletApiService.stakeO3(token, res);
        } else {
          this.vaultdMetaMaskWalletApiService.unstakeO3(token, res);
        }
      }
    });
  }

  async showStakingStake(
    token: Token,
    balance: string,
    isStake: boolean = true
  ): Promise<void> {
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    let modal;
    if (!this.commonService.isMobileWidth()) {
      modal = this.modal.create({
        nzContent: VaultStakeModalComponent,
        nzFooter: null,
        nzTitle: null,
        nzClosable: false,
        nzClassName: 'custom-modal custom-stake-modal',
        nzComponentParams: {
          token,
          balance,
          isStake,
        },
      });
    } else {
      modal = this.drawerService.create({
        nzContent: VaultStakeDrawerComponent,
        nzTitle: null,
        nzClosable: false,
        nzPlacement: 'bottom',
        nzWrapClassName: 'custom-drawer',
        nzContentParams: {
          token,
          balance,
          isStake,
        },
      });
    }
    modal.afterClose.subscribe(async (res) => {
      if (res) {
        const showApprove = await this.checkShowApprove(
          token,
          this.vaultdMetaMaskWalletApiService.vaultWallet.address,
          res,
          contractHash
        );
        if (showApprove === true) {
          this.showApproveModal(token, contractHash);
          return;
        }
        if (isStake) {
          this.vaultdMetaMaskWalletApiService.o3StakingStake(token, res);
        } else {
          this.vaultdMetaMaskWalletApiService.o3StakingUnStake(token, res);
        }
      }
    });
  }

  async claimUnlockO3(token: any): Promise<void> {
    const claimable = new BigNumber(token.claimable);
    if (claimable.isNaN() || claimable.isZero()) {
      return;
    }
    const contractHash = O3TOKEN_CONTRACT;
    this.vaultdMetaMaskWalletApiService.claimUnlocked(token, token.claimable);
  }

  async claimProfit(token: any): Promise<void> {
    const claimable = new BigNumber(token.profit);
    if (claimable.isNaN() || claimable.isZero()) {
      return;
    }
    const contractHash = O3STAKING_CONTRACT[token.assetID];
    this.vaultdMetaMaskWalletApiService.o3StakingClaimProfit(
      token,
      token.profit
    );
  }

  async checkShowApprove(
    token: Token,
    address: string,
    inputAmount: string,
    spender: string
  ): Promise<boolean> {
    const balance = await this.metaMaskWalletApiService.getAllowance(
      token,
      address,
      null,
      spender
    );
    if (new BigNumber(balance).comparedTo(new BigNumber(inputAmount)) >= 0) {
      return false;
    } else {
      return true;
    }
  }
  showApproveModal(token: Token, spender: string): void {
    const walletName = this.vaultdMetaMaskWalletApiService.vaultWallet
      .walletName;
    const address = this.vaultdMetaMaskWalletApiService.vaultWallet.address;
    if (!this.commonService.isMobileWidth()) {
      this.modal.create({
        nzContent: ApproveModalComponent,
        nzFooter: null,
        nzTitle: null,
        nzClosable: false,
        nzMaskClosable: false,
        nzClassName: 'custom-modal',
        nzComponentParams: {
          fromToken: token,
          fromAddress: address,
          walletName,
          spender,
        },
      });
    } else {
      this.drawerService.create({
        nzContent: ApproveDrawerComponent,
        nzTitle: null,
        nzClosable: false,
        nzPlacement: 'bottom',
        nzWrapClassName: 'custom-drawer approve',
        nzContentParams: {
          fromToken: token,
          fromAddress: address,
          walletName,
          spender,
        },
      });
    }
  }
}

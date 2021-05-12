import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  CommonService,
  VaultdMetaMaskWalletApiService,
  SwapService,
  EthApiService,
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
import {
  LP_STAKING_TOKENS,
  LP_TOKENS,
  MESSAGE,
  O3STAKING_CONTRACT,
  O3TOKEN_CONTRACT,
  O3_TOKEN,
  Token,
  TOKEN_STAKING_TOKENS,
  UNLOCK_LP_TOKENS,
  USD_TOKENS,
} from '@lib';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
interface State {
  language: any;
}
interface State {
  vault: any;
  rates: any;
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
  isCanClick = true;

  ratesUnScribe: Unsubscribable;
  rates$: Observable<any>;
  rates = {};

  o3Locked = '--';
  o3Available = '--';
  o3Total = '--';

  totalProfit = '--';
  stakeUnlockTokenList: any[] = UNLOCK_LP_TOKENS;
  o3StakingTokenList: any[] = TOKEN_STAKING_TOKENS;
  lpstakingTokenList: any[] = LP_STAKING_TOKENS;
  constructor(
    private store: Store<State>,
    private modal: NzModalService,
    private nzMessage: NzMessageService,
    private vaultdMetaMaskWalletApiService: VaultdMetaMaskWalletApiService,
    private drawerService: NzDrawerService,
    private commonService: CommonService,
    private swapService: SwapService,
    private ethApiService: EthApiService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.vault$ = store.select('vault');
    this.rates$ = store.select('rates');
  }

  ngOnInit(): void {
    return;
    this.vaultUnScribe = this.vault$.subscribe((state) => {
      if (this.vaultdMetaMaskWalletApiService.vaultWallet) {
        this.initO3Data();
      }
    });
    this.ratesUnScribe = this.rates$.subscribe((state) => {
      this.rates = state.rates;
    });
    interval(15000).subscribe(() => {
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
    if (this.ratesUnScribe) {
      this.ratesUnScribe.unsubscribe();
    }
  }

  async initO3Data(): Promise<void> {
    return;
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
        this.swapService.getEthBalancByHash(
          item,
          this.vaultdMetaMaskWalletApiService.vaultWallet.address
        ) || '--',
        this.vaultdMetaMaskWalletApiService.claimableUnlocked(item) || '--',
        this.vaultdMetaMaskWalletApiService.getUnlockSpeed(item) || '--',
      ]).then((res) => {
        [item.staked, item.remaining, item.claimable, item.speed] = res;
      });
    });
    // o3 Staking
    this.o3StakingTokenList.forEach(async (item: any) => {
      Promise.all([
        this.swapService.getEthBalancByHash(
          item,
          this.vaultdMetaMaskWalletApiService.vaultWallet.address
        ) || '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingTotalStaing(item) ||
          '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingStaked(item) || '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingSharePerBlock(item) ||
          '0',
      ]).then((res) => {
        [
          item.balance,
          item.totalStaking,
          item.staked,
          item.sharePerBlock,
        ] = res;
        item.apy = this.getStakingAYP(item);
      });
    });
    // lp staking
    this.lpstakingTokenList.forEach(async (item: any) => {
      Promise.all([
        this.swapService.getEthBalancByHash(
          item,
          this.vaultdMetaMaskWalletApiService.vaultWallet.address
        ) || '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingTotalStaing(item) ||
          '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingStaked(item) || '--',
        this.vaultdMetaMaskWalletApiService.getO3StakingSharePerBlock(item) ||
          '0',
      ]).then((res) => {
        [
          item.balance,
          item.totalStaking,
          item.staked,
          item.sharePerBlock,
        ] = res;
        item.apy = this.getStakingAYP(item);
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
    return;
    let modal;
    if (!this.checkWalletConnect()) {
      return;
    }
    if (this.ethApiService.checkNetwork(token) === false) {
      return;
    }
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
        if (!this.checkBalance(balance, res)) {
          return;
        }
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
    return;
    if (!this.checkWalletConnect()) {
      return;
    }
    if (this.ethApiService.checkNetwork(token) === false) {
      return;
    }
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
        if (!this.checkBalance(balance, res)) {
          return;
        }
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
    return;
    if (!this.checkWalletConnect()) {
      return;
    }
    if (this.ethApiService.checkNetwork(token) === false) {
      return;
    }
    if (this.isCanClick) {
      this.isCanClick = false;
      setTimeout(() => {
        this.isCanClick = true;
      }, 4000);
    } else {
      return;
    }
    const claimable = new BigNumber(token.claimable);
    if (claimable.isNaN() || claimable.isZero()) {
      return;
    }
    const contractHash = O3TOKEN_CONTRACT;
    this.vaultdMetaMaskWalletApiService.claimUnlocked(token, token.claimable);
  }

  async claimProfit(token: any): Promise<void> {
    return;
    if (!this.checkWalletConnect()) {
      return;
    }
    if (this.ethApiService.checkNetwork(token) === false) {
      return;
    }
    if (this.isCanClick) {
      this.isCanClick = false;
      setTimeout(() => {
        this.isCanClick = true;
      }, 4000);
    } else {
      return;
    }
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

  getStakingAYP(token: any): string {
    const tokenPrice = this.getTokenPrice(token);
    const O3TokenPrice = this.getTokenPrice(O3_TOKEN);
    const yearSecond = new BigNumber('31536000');
    const blockTime = new BigNumber('15');
    const yearBlock = yearSecond.div(blockTime);
    const sharePerBlock = new BigNumber(token.sharePerBlock);
    const totalStaked = token.totalStaking;
    const result = yearBlock.times(sharePerBlock).div(totalStaked).times(100);
    let priceRatio = new BigNumber(O3TokenPrice).div(new BigNumber(tokenPrice));
    if (token.assetID === O3_TOKEN.assetID) {
      priceRatio = new BigNumber(1);
    }
    if (
      priceRatio.isNaN() ||
      priceRatio.comparedTo(0) === 0 ||
      !priceRatio.isFinite() ||
      result.isNaN()
    ) {
      return '--';
    } else {
      return result.times(priceRatio).toFixed();
    }
  }
  getLP(token: Token): void {
    return;
    window.open(
      `https://app.uniswap.org/#/add/v2/${token.pairTokens[0]}/${token.pairTokens[1]}`
    );
  }

  getTokenPrice(token: Token): string {
    if (token.pairTokens) {
      let resultPrice = new BigNumber(0);
      token.pairTokens.forEach((item) => {
        const price = this.commonService.getAssetRateByHash(
          this.rates,
          item,
          token.chain
        );
        if (new BigNumber(price).comparedTo(0) <= 0) {
          return '0';
        }
        resultPrice = resultPrice.plus(new BigNumber(price));
      });
      return resultPrice.toFixed();
    } else {
      if (
        LP_TOKENS.filter((item) => {
          return this.commonService.judgeAssetHash(token.assetID, item.assetID);
        }).length > 0
      ) {
        return this.commonService.getAssetRateByHash(
          this.rates,
          USD_TOKENS[0].assetID,
          USD_TOKENS[0].chain
        );
      }
      return this.commonService.getAssetRateByHash(
        this.rates,
        token.assetID,
        token.chain
      );
    }
  }

  async checkShowApprove(
    token: Token,
    address: string,
    inputAmount: string,
    spender: string
  ): Promise<boolean> {
    const balance = await this.ethApiService.getAllowance(
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
  checkBalance(balance: string, input: string): boolean {
    const balanceNumber = new BigNumber(balance);
    const inputNumber = new BigNumber(input);
    if (balanceNumber.comparedTo(input) < 0 || balanceNumber.isNaN()) {
      this.nzMessage.error(MESSAGE.InsufficientBalance[this.lang]);
      return false;
    }
    return true;
  }
  checkWalletConnect(): boolean {
    if (!this.vaultdMetaMaskWalletApiService.vaultWallet) {
      this.nzMessage.error(MESSAGE.ConnectWalletFirst[this.lang](['ETH']));
      return false;
    }
    return true;
  }
  showApproveModal(token: Token, spender: string): void {
    return;
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

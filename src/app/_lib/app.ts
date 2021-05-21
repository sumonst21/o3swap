import { Token } from './token';
import { WalletName } from './wallet';

export type TxProgress = {
  step1: { hash: string; status: 0 | 1 | 2 }; // 0 = 未开始, 1 = 进行中, 2 = 已完成
  step2: { hash: string; status: 0 | 1 | 2 }; // 0 = 未开始, 1 = 进行中, 2 = 已完成
  step3: { hash: string; status: 0 | 1 | 2 }; // 0 = 未开始, 1 = 进行中, 2 = 已完成
};

export enum TransactionType {
  swap = 'swap',
  withdraw = 'withdraw',
  deposit = 'deposit',
  approve = 'approve',
  stake = 'stake',
  unstake = 'unstake',
  claim = 'claim',
}
export interface MyTransaction {
  txid: string;
  isPending: boolean;
  fromToken: Token;
  toToken?: Token;
  amount: string;
  receiveAmount?: string;
  progress?: TxProgress;
  isFailed?: boolean;
  walletName?: WalletName;
  transactionType: TransactionType;
  contract?: string;
  fromAddress?: string;
}

export const LOCAL_TRANSACTIONS_KEY = 'transactions';

export type TxAtPage = 'swap' | 'bridge' | 'liquidity' | 'vault';

export const INIT_CHAIN_TOKENS = {
  ETH: [],
  NEO: [],
  BSC: [],
  HECO: [],
  ALL: [],
};

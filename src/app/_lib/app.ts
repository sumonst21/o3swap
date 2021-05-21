import { Token } from './token';
import { WalletName } from './wallet';

export type TxProgress = {
  step1: { hash: string; status: 0 | 1 | 2 }; // 0 = not start, 1 = pending, 2 = finish
  step2: { hash: string; status: 0 | 1 | 2 }; // 0 = not start, 1 = pending, 2 = finish
  step3: { hash: string; status: 0 | 1 | 2 }; // 0 = not start, 1 = pending, 2 = finish
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

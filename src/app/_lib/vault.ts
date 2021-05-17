import { Token } from '@lib';
import { ConnectChainType, WalletName } from './wallet';
export interface VaultWallet {
  walletName: WalletName;
  address: string;
  chain: ConnectChainType;
}

export enum VaultTransactionType {
  stake = 0,
  unstake = 1,
  claim = 2,
}
export interface VaultTransaction {
  txid: string;
  isPending: boolean;
  fromToken: Token;
  amount: string;
  isFailed?: boolean;
  // 0 stake 1 unstake 2 claim
  transactionType: number;
  walletName?: WalletName;
  min: boolean;
}

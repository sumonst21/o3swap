import { Network } from './network';
import { NeoWalletName, EthWalletName } from './wallet';

export interface SwapStateType {
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  balances: object;
  ethBalances: object;
  bscBalances: object;
  hecoBalances: object;
  neolineNetwork: Network;
  metamaskNetworkId: number;
}

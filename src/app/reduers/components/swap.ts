import {
  SwapStateType,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  RESET_NEO_BALANCES,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_NEO_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_METAMASK_NETWORK_ID,
  UPDATE_NEOLINE_NETWORK,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  RESET_ETH_BALANCES,
  UPDATE_ETH_BALANCES,
  RESET_BSC_BALANCES,
  RESET_HECO_BALANCES,
  UPDATE_BSC_BALANCES,
  UPDATE_HECO_BALANCES,
} from '@lib';

const initialState: SwapStateType = {
  neoWalletName: null,
  ethWalletName: null,
  bscWalletName: null,
  hecoWalletName: null,
  neoAccountAddress: null,
  ethAccountAddress: null,
  bscAccountAddress: null,
  hecoAccountAddress: null,
  balances: {}, // neo balances
  ethBalances: {},
  bscBalances: {},
  hecoBalances: {},
  neolineNetwork: null,
  metamaskNetworkId: null,
};

export default function swap(state = initialState, action): any {
  switch (action.type) {
    case UPDATE_NEO_WALLET_NAME:
      setSessionStorage('neoWalletName', action.data);
      return { ...state, neoWalletName: action.data };
    case UPDATE_ETH_WALLET_NAME:
      setSessionStorage('ethWalletName', action.data);
      return { ...state, ethWalletName: action.data };
    case UPDATE_BSC_WALLET_NAME:
      setSessionStorage('bscWalletName', action.data);
      return { ...state, bscWalletName: action.data };
    case UPDATE_HECO_WALLET_NAME:
      setSessionStorage('hecoWalletName', action.data);
      return { ...state, hecoWalletName: action.data };

    case UPDATE_NEO_ACCOUNT:
      return { ...state, neoAccountAddress: action.data };
    case UPDATE_ETH_ACCOUNT:
      return { ...state, ethAccountAddress: action.data };
    case UPDATE_BSC_ACCOUNT:
      return { ...state, bscAccountAddress: action.data };
    case UPDATE_HECO_ACCOUNT:
      return { ...state, hecoAccountAddress: action.data };

    case UPDATE_NEO_BALANCES:
      return { ...state, balances: action.data };
    case RESET_NEO_BALANCES:
      return { ...state, balances: {} };

    case UPDATE_ETH_BALANCES:
      return { ...state, ethBalances: action.data };
    case RESET_ETH_BALANCES:
      return { ...state, ethBalances: {} };

    case UPDATE_BSC_BALANCES:
      return { ...state, bscBalances: action.data };
    case RESET_BSC_BALANCES:
      return { ...state, bscBalances: {} };

    case UPDATE_HECO_BALANCES:
      return { ...state, hecoBalances: action.data };
    case RESET_HECO_BALANCES:
      return { ...state, hecoBalances: {} };

    case UPDATE_NEOLINE_NETWORK:
      return { ...state, neolineNetwork: action.data };
    case UPDATE_METAMASK_NETWORK_ID:
      return { ...state, metamaskNetworkId: action.data };
    default:
      return state;
  }
}

function setSessionStorage(key: string, value: any): void {
  if (value === null) {
    sessionStorage.removeItem(key);
  } else {
    sessionStorage.setItem(key, value);
  }
}

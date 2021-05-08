import {
  RESET_VAULT_WALLET,
  UPDATE_VAULT_STAKE_PENDING_TX,
  UPDATE_VAULT_WALLET,
} from '@lib';

const initialState = {
  vaultWallet: null,
  vaultTransaction: null,
  // {
  //   walletName: null,
  //   address: null,
  //   chain: null,
  // },
};

export default function vault(state = initialState, action): any {
  switch (action.type) {
    case UPDATE_VAULT_WALLET:
      setSessionStorage('vaulteWallet', action.data);
      return { ...state, vaultWallet: action.data };
    case RESET_VAULT_WALLET:
      setSessionStorage('vaulteWallet', null);
      return { ...state, vaultWallet: null };
    case UPDATE_VAULT_STAKE_PENDING_TX:
      setlocalStorage('vaultTransaction', action.data);
      return { ...state, vaultTransaction: action.data };
    default:
      return state;
  }
}

function setSessionStorage(key: string, value: any): void {
  if (value === null) {
    sessionStorage.removeItem(key);
  } else {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}

function setlocalStorage(key: string, value: any): void {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

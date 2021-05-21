import {
  INIT_CHAIN_TOKENS,
  UPDATE_CHAIN_TOKENS,
  MyTransaction,
  UPDATE_TX,
  ADD_TX,
  REMOVE_TX,
  CLEAR_ALL_TXS,
  LOCAL_TRANSACTIONS_KEY,
  INIT_TXS,
} from '@lib';

const initialState = {
  chainTokens: INIT_CHAIN_TOKENS,
  transactions: [],
};

export default function app(state = initialState, action): any {
  switch (action.type) {
    case UPDATE_CHAIN_TOKENS:
      return { ...state, chainTokens: action.data };
    case UPDATE_TX:
      return {
        ...state,
        transactions: updateTx(action.data, state.transactions),
      };
    case ADD_TX:
      return { ...state, transactions: addTx(action.data, state.transactions) };
    case REMOVE_TX:
      return {
        ...state,
        transactions: removeTx(action.data, state.transactions),
      };
    case CLEAR_ALL_TXS:
      clearAllTx();
      return { ...state, transactions: [] };
    case INIT_TXS:
      return { ...state, transactions: action.data };
    default:
      return state;
  }
}

function updateTx(tx: MyTransaction, txArr: MyTransaction[]): MyTransaction[] {
  const targetArr = [...txArr];
  const index = targetArr.findIndex((item) => item.txid === tx.txid);
  targetArr[index] = JSON.parse(JSON.stringify(tx));
  localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(targetArr));
  return targetArr;
}

function addTx(tx: MyTransaction, txArr: MyTransaction[]): MyTransaction[] {
  const targetArr = [...txArr];
  targetArr.unshift(tx);
  if (targetArr.length > 5) {
    targetArr.pop();
  }
  localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(targetArr));
  return targetArr;
}

function removeTx(tx: MyTransaction, txArr: MyTransaction[]): MyTransaction[] {
  const targetArr = [...txArr];
  const index = targetArr.findIndex((item) => item.txid === tx.txid);
  targetArr.splice(index);
  localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(targetArr));
  return targetArr;
}

function clearAllTx(): any {
  localStorage.removeItem(LOCAL_TRANSACTIONS_KEY);
}

export const MESSAGE = {
  CopiedSuccessfully: {
    en: `Copied Successfully`,
    zh: `复制成功`,
  },
  UpdateMetaMaskExtension: {
    en: `Please update your MetaMask extension`,
    zh: `请更新你的 MetaMask`,
  },
  ConnectionSucceeded: {
    en: `Connection succeeded!`,
    zh: `连接成功`,
  },
  SwitchMetaMaskNetwork: {
    en: (params: string[]) =>
      `Please switch network to ${params[0]} ${params[1]} on MetaMask extension.`,
    zh: (params: string[]) =>
      `请在MetaMask上将网络切换到${params[0]} ${params[1]}`,
  },
  SwitchNeolineNetwork: {
    en: (params: string[]) =>
      `Please switch network to ${params[0]} on NeoLine extension.`,
    zh: (params: string[]) => `请在NeoLine上将网络切换到${params[0]}`,
  },
  InsufficientBalance: {
    en: `Insufficient balance`,
    zh: `余额不足`,
  },
  SystemBusy: {
    en: `System busy`,
    zh: `系统繁忙`,
  },
  O3DAPINotReady: {
    en: `O3 dAPI is not ready, please open O3 wallet before use.`,
    zh: `O3 dAPI 尚未准备好，请在使用前打开O3钱包`,
  },
  EnterVaildEmail: {
    en: `please enter your vaild email`,
    zh: `请输入有效的电子邮箱`,
  },
  ConnectWalletFirst: {
    en: (params: string[]) => `Please connect the ${params[0]} wallet first`,
    zh: (params: string[]) => `请先连接${params[0]}钱包`,
  },
  InsufficientPolyFee: {
    en: (params: string[]) => `Insufficient ${params[0]} for poly fee`,
    zh: (params: string[]) => `${params[0]}不足以支付手续费`,
  },
  maximumLimit: {
    en: `You've exceeded the maximum limit`,
    zh: `已超出金额上限`,
  },
  WrongInput: {
    en: `Wrong input`,
    zh: `输入错误`,
  },
  decimalLimit: {
    en: `You've exceeded the decimal limit.`,
    zh: `已超出小数位数限制`,
  },
  quoteAgain: {
    en: `Did not get the quotation, please get it again`,
    zh: `找不到报价，请再次请求以获取最新价格`,
  },
  InsufficientAmountAndPolyFee: {
    en: (params: string[]) =>
      `Insufficient ${params[0]} for transfer amount and poly fee`,
    zh: (params: string[]) => `${params[0]}不足以支付转账金额和手续费`,
  },
  receive0: {
    en: (params: string[]) => `you will receive 0 ${params[0]}`,
    zh: (params: string[]) => `你将收到 0 ${params[0]}`,
  },
  contractPreExecutionError: {
    en: 'Transaction Error. Exception thrown in contract code.',
    zh: '交易出错。合约代码执行异常。',
  },
};

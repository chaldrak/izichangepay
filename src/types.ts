export type Coin =
  | "ada.bep20"
  | "bnb"
  | "btc"
  | "btc.bep20"
  | "busd.bep20"
  | "doge.bep20"
  | "dogs.ton"
  | "dot.bep20"
  | "eth"
  | "eth.bep20"
  | "opbnb"
  | "shib.bep20"
  | "sol.bep20"
  | "ton"
  | "ton.bep20"
  | "trx"
  | "twt.bep20"
  | "usdc.bep20"
  | "usdc.erc20"
  | "usdc.trc20"
  | "usdt.bep20"
  | "usdt.erc20"
  | "usdt.opbnb"
  | "usdt.ton"
  | "usdt.trc20"
  | "xrp.bep20"
  | (string & {});

export interface IziChangePayConfig {
  apiKey: string;
  secretKey: string;
  /** @default "sandbox" */
  environment?: "sandbox" | "live";
  /** Timeout en ms @default 30000 */
  timeout?: number;
}

export interface GeneratePayinRedirectUrlInput {
  /** @default "trx" */
  coin?: Coin;
  acceptedCoins?: string[];
  amount: string;
  successUrl: string;
  canceledUrl: string;
  failedUrl: string;
  /** @default "" */
  memo?: string;
}

export interface GeneratePayinRedirectUrlWithCustomerInput
  extends GeneratePayinRedirectUrlInput {
  firstname?: string;
  lastname?: string;
  email?: string;
}

export interface PayoutInput {
  amount: string;
  /** Adresse du portefeuille destinataire */
  address: string;
  coin?: Coin;
}

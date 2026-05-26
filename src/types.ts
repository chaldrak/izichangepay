export type Coin =
  | "bnb"
  | "btc"
  | "btc.bep20"
  | "eth"
  | "ton"
  | "trx"
  | "usdc.bep20"
  | "usdc.trc20"
  | "usdt.bep20"
  | "usdt.ton"
  | "usdt.trc20"
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

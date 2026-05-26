import { dataToSigningString, signData } from "./signer.js";
import type {
  GeneratePayinRedirectUrlInput,
  GeneratePayinRedirectUrlWithCustomerInput,
  IziChangePayConfig,
  PayoutInput,
} from "./types.js";

function getBaseUrl(env: "sandbox" | "live"): string {
  return env === "live"
    ? "https://pay.izichange.com"
    : "https://sandbox-pay.izichange.com";
}

export class IziChangePayClient {
  readonly #apiKey: string;
  readonly #secretKey: string;
  readonly #baseUrl: string;
  readonly #timeout: number;

  constructor(config: IziChangePayConfig) {
    if (!config.apiKey) {
      throw new Error("IziChangePayClient: apiKey is required");
    }
    if (!config.secretKey) {
      throw new Error("IziChangePayClient: secretKey is required");
    }
    this.#apiKey = config.apiKey;
    this.#secretKey = config.secretKey;
    this.#baseUrl = getBaseUrl(config.environment ?? "sandbox");
    this.#timeout = config.timeout ?? 30000;
  }

  async #request(
    path: string,
    data: Record<string, unknown>,
    signature: string,
    method: "POST" | "GET" = "POST",
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": this.#apiKey,
          "x-signature": signature,
        },
        signal: controller.signal,
      };

      if (method === "POST") {
        options.body = JSON.stringify(data);
      }

      const res = await fetch(`${this.#baseUrl}${path}`, options);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null) as Record<string, unknown> | null;
        const err = new Error(
          `IziChangePay ${method} ${path} failed: ${res.status} — ${res.statusText}`,
        );
        Object.assign(err, { response: { data: errorData, status: res.status } });
        throw err;
      }

      return res.json() as Promise<Record<string, unknown>>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Récupère le solde du portefeuille pour une cryptomonnaie donnée.
   *
   * @param coin Cryptomonnaie à interroger (défaut : "trx")
   * @returns Les données de solde retournées par l'API
   */
  async getBalance(coin = "trx"): Promise<Record<string, unknown>> {
    const toSignData = { coin };
    const signature = signData(dataToSigningString(toSignData), this.#secretKey);
    return this.#request("/api/payements/balance", toSignData, signature);
  }

  /**
   * Génère une URL de redirection pour un paiement entrant (payin).
   * L'utilisateur est redirigé vers cette URL pour effectuer le paiement.
   *
   * @param input.amount       Montant attendu
   * @param input.successUrl   URL de redirection en cas de succès
   * @param input.canceledUrl  URL de redirection en cas d'annulation
   * @param input.failedUrl    URL de redirection en cas d'échec
   * @param input.coin         Cryptomonnaie principale (défaut : "trx")
   * @param input.acceptedCoins Cryptomonnaies acceptées en alternative
   * @param input.memo         Référence libre non incluse dans la signature
   * @returns La réponse API contenant l'URL de paiement
   */
  async generatePayinRedirectUrl(
    input: GeneratePayinRedirectUrlInput,
  ): Promise<Record<string, unknown>> {
    const {
      coin = "trx",
      acceptedCoins,
      amount,
      successUrl,
      canceledUrl,
      failedUrl,
      memo = "",
    } = input;

    const toSignData = { coin, acceptedCoins, amount, successUrl, canceledUrl, failedUrl };
    const data = { ...toSignData, memo };
    const signature = signData(dataToSigningString(toSignData), this.#secretKey);

    return this.#request("/api/payements/generate_url", data, signature);
  }

  /**
   * Génère une URL de paiement entrant (payin) en associant les données client.
   * Identique à `generatePayinRedirectUrl` avec en plus les informations du payeur.
   *
   * @param input.amount       Montant attendu
   * @param input.successUrl   URL de redirection en cas de succès
   * @param input.canceledUrl  URL de redirection en cas d'annulation
   * @param input.failedUrl    URL de redirection en cas d'échec
   * @param input.coin         Cryptomonnaie principale (défaut : "trx")
   * @param input.acceptedCoins Cryptomonnaies acceptées en alternative
   * @param input.firstname    Prénom du client
   * @param input.lastname     Nom du client
   * @param input.email        Email du client
   * @param input.memo         Référence libre non incluse dans la signature
   * @returns La réponse API contenant l'URL de paiement
   */
  async generatePayinRedirectUrlWithCustomer(
    input: GeneratePayinRedirectUrlWithCustomerInput,
  ): Promise<Record<string, unknown>> {
    const {
      coin = "trx",
      acceptedCoins,
      amount,
      successUrl,
      canceledUrl,
      failedUrl,
      firstname,
      lastname,
      email,
      memo = "",
    } = input;

    const toSignData = { coin, acceptedCoins, amount, successUrl, canceledUrl, failedUrl };
    const data = { ...toSignData, firstname, lastname, email, memo };
    const signature = signData(dataToSigningString(toSignData), this.#secretKey);

    return this.#request(
      "/api/payements/init_operation_with_customer_data",
      data,
      signature,
    );
  }

  /**
   * Effectue un retrait (payout) vers une adresse de portefeuille externe.
   *
   * @param input.amount  Montant à envoyer
   * @param input.address Adresse du portefeuille destinataire
   * @param input.coin    Cryptomonnaie à utiliser (défaut : "trx")
   * @returns L'adresse de destination confirmée par l'API, ou `undefined`
   * @throws  Si `amount` ou `address` est absent, ou si la requête échoue
   */
  async payout(input: PayoutInput): Promise<string | undefined> {
    const { amount, address, coin = "trx" } = input;

    if (!amount) {
      throw new Error("IziChangePayClient: amount is required for payout");
    }
    if (!address) {
      throw new Error("IziChangePayClient: address is required for payout");
    }

    const data = { coin, amount, address };
    const signature = signData(dataToSigningString(data), this.#secretKey);

    const res = await this.#request("/api/payements/payout", data, signature);
    const responseData = res.data as Record<string, unknown> | undefined;
    return responseData?.address as string | undefined;
  }
}

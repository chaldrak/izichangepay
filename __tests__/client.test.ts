import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { IziChangePayClient } from "../src/client.js";
import { dataToSigningString, signData } from "../src/signer.js";

const mockFetch = jest.spyOn(globalThis, "fetch");

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

const SECRET_KEY = "test_secret";
const API_KEY = "test_api_key";
const BASE_CONFIG = { apiKey: API_KEY, secretKey: SECRET_KEY };

describe("IziChangePayClient — constructeur", () => {
  it("lève une erreur si apiKey est absent", () => {
    expect(
      () => new IziChangePayClient({ apiKey: "", secretKey: SECRET_KEY }),
    ).toThrow("apiKey is required");
  });

  it("lève une erreur si secretKey est absent", () => {
    expect(
      () => new IziChangePayClient({ apiKey: API_KEY, secretKey: "" }),
    ).toThrow("secretKey is required");
  });

  it("instancie correctement en mode sandbox (défaut)", () => {
    expect(() => new IziChangePayClient(BASE_CONFIG)).not.toThrow();
  });

  it("instancie correctement en mode live", () => {
    expect(
      () => new IziChangePayClient({ ...BASE_CONFIG, environment: "live" }),
    ).not.toThrow();
  });
});

describe("IziChangePayClient — getBalance", () => {
  beforeEach(() => { mockFetch.mockClear(); });

  it("appelle le bon endpoint avec x-api-key et x-signature", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { balance: "100" } }));

    const client = new IziChangePayClient(BASE_CONFIG);
    await client.getBalance("trx");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(url).toContain("/api/payements/balance");
    expect(headers["x-api-key"]).toBe(API_KEY);
    expect(headers["x-signature"]).toBe(
      signData(dataToSigningString({ coin: "trx" }), SECRET_KEY),
    );
  });

  it("lève une erreur HTTP", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: "Unauthorized" }, 401));

    const client = new IziChangePayClient(BASE_CONFIG);
    await expect(client.getBalance()).rejects.toThrow("401");
  });
});

describe("IziChangePayClient — generatePayinRedirectUrl", () => {
  beforeEach(() => { mockFetch.mockClear(); });

  it("appelle le bon endpoint avec la signature correcte", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ url: "https://pay.izichange.com/pay/abc" }));

    const client = new IziChangePayClient(BASE_CONFIG);
    await client.generatePayinRedirectUrl({
      amount: "50",
      successUrl: "https://example.com/success",
      canceledUrl: "https://example.com/canceled",
      failedUrl: "https://example.com/failed",
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    const body = JSON.parse(init.body as string) as Record<string, unknown>;

    expect(url).toContain("/api/payements/generate_url");
    expect(headers["x-api-key"]).toBe(API_KEY);
    expect(body.memo).toBe("");
    expect(body.coin).toBe("trx");
    expect(headers["x-signature"]).toBeTruthy();
  });

  it("le memo est dans le body mais pas dans la signature", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}));

    const client = new IziChangePayClient(BASE_CONFIG);
    await client.generatePayinRedirectUrl({
      amount: "50",
      successUrl: "https://example.com/s",
      canceledUrl: "https://example.com/c",
      failedUrl: "https://example.com/f",
      memo: "Order #42",
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    const body = JSON.parse(init.body as string) as Record<string, unknown>;

    const toSignData = {
      coin: "trx",
      amount: "50",
      successUrl: "https://example.com/s",
      canceledUrl: "https://example.com/c",
      failedUrl: "https://example.com/f",
    };

    expect(body.memo).toBe("Order #42");
    expect(headers["x-signature"]).toBe(
      signData(dataToSigningString(toSignData), SECRET_KEY),
    );
  });
});

describe("IziChangePayClient — payout", () => {
  beforeEach(() => { mockFetch.mockClear(); });

  it("lève une erreur si amount est absent", async () => {
    const client = new IziChangePayClient(BASE_CONFIG);
    await expect(client.payout({ amount: "", address: "TMyWallet" })).rejects.toThrow("amount is required");
  });

  it("lève une erreur si address est absent", async () => {
    const client = new IziChangePayClient(BASE_CONFIG);
    await expect(client.payout({ amount: "100", address: "" })).rejects.toThrow("address is required");
  });

  it("retourne l'adresse depuis response.data.address", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: { address: "TX123abc" } }),
    );

    const client = new IziChangePayClient(BASE_CONFIG);
    const address = await client.payout({ amount: "100", coin: "trx", address: "TMyWallet" });

    expect(address).toBe("TX123abc");
  });

  it("appelle le bon endpoint", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));

    const client = new IziChangePayClient(BASE_CONFIG);
    await client.payout({ amount: "50", address: "TMyWallet", coin: "trx" });

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/api/payements/payout");
  });
});

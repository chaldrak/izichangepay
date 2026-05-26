import { describe, expect, it } from "@jest/globals";
import { dataToSigningString, signData } from "../src/signer.js";

describe("signData", () => {
  it("retourne une signature HMAC-SHA256 en hex (64 caractères)", () => {
    const sig = signData("coin=trx", "my_secret");
    expect(typeof sig).toBe("string");
    expect(sig).toHaveLength(64);
  });

  it("est déterministe — même entrée, même sortie", () => {
    expect(signData("coin=trx", "my_secret")).toBe(signData("coin=trx", "my_secret"));
  });

  it("produit des signatures différentes pour des données différentes", () => {
    expect(signData("coin=trx", "my_secret")).not.toBe(signData("coin=btc", "my_secret"));
  });

  it("produit des signatures différentes pour des clés différentes", () => {
    expect(signData("coin=trx", "secret_a")).not.toBe(signData("coin=trx", "secret_b"));
  });
});

describe("dataToSigningString", () => {
  it("concatène les paires clé=valeur", () => {
    expect(dataToSigningString({ coin: "trx", amount: "50" })).toBe("coin=trxamount=50");
  });

  it("ignore les tableaux", () => {
    const result = dataToSigningString({
      coin: "trx",
      acceptedCoins: ["trx", "usdt.trc20"],
      amount: "50",
    });
    expect(result).toBe("coin=trxamount=50");
    expect(result).not.toContain("acceptedCoins");
  });

  it("retourne une chaîne vide pour un objet vide", () => {
    expect(dataToSigningString({})).toBe("");
  });
});

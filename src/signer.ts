import { createHmac } from "node:crypto";

export function signData(data: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(data).digest("hex");
}

/** Sérialise un objet en chaîne de signature en ignorant les tableaux. */
export function dataToSigningString(data: Record<string, unknown>): string {
  let result = "";
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && !Array.isArray(value)) {
      result += `${key}=${value}`;
    }
  }
  return result;
}

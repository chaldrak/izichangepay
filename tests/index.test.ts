// Exemple de test : tests/index.test.ts
import { describe, expect, it } from "vitest";
import { salut } from "../src";

describe("salut", () => {
	it("devrait retourner un message de salutation", () => {
		expect(salut("Chaldrak")).toBe("Salut, Chaldrak ! 👋");
	});
});

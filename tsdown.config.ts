import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	dts: true, // Génère automatiquement les .d.ts
	clean: true, // Nettoie dist avant chaque build
	sourcemap: true,
});

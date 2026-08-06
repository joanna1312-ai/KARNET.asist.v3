import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Testy e2e (Playwright, Sesja 13) mają własny runner (`npm run test:e2e`) i własne
    // globalne `test()` — nie powinny być zbierane przez Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});

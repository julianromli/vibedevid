import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // biome-ignore lint/suspicious/noExplicitAny: vite/vitest nested-version Plugin type mismatch
  plugins: [react(), tsconfigPaths()] as any,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Vite+ resolves `zod` through its `@zod/source` export condition in test
      // graphs; the source tree has no runtime `z` namespace (assembled only by
      // the package bundler). Pin zod to its built entry so `import { z } from
      // "zod"` works under the runner.
      zod: path.resolve(__dirname, "tests/setup/zod-shim.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/unit/**/*.spec.ts", "tests/integration/**/*.spec.ts"],
  },
});

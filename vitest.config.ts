import path from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite-plus";

export default defineConfig({
  // biome-ignore lint/suspicious/noExplicitAny: vite/vitest nested-version Plugin type mismatch
  plugins: [react(), tsconfigPaths()] as any,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/unit/**/*.spec.ts", "tests/integration/**/*.spec.ts"],
  },
});

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

const supabaseNodeFetchShim = fileURLToPath(
  new URL("./lib/supabase/node-fetch-shim.mjs", import.meta.url),
);

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
    // `@supabase/node-fetch` imports `node:http`/`node:https`, unavailable on
    // Cloudflare Workers. Alias it to a shim over the runtime-native fetch.
    alias: {
      "@supabase/node-fetch": supabaseNodeFetchShim,
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "app",
      router: {
        routesDirectory: "routes",
        routeFileIgnorePattern: "components|boards|legacy",
      },
    }),
    viteReact(),
    nitro({
      compatibilityDate: "2024-09-19",
      preset: "cloudflare_module",
      cloudflare: {
        deployConfig: false,
        nodeCompat: true,
      },
    }),
  ],
});

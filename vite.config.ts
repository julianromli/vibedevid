import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    options: {
      ignorePath: ".oxfmtignore",
    },
  },
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
      // Long-lived caching for static public assets. Nitro writes these into the
      // generated `_headers` file (Cloudflare honours them). The hashed JS/CSS in
      // `/assets/**` is already handled by the framework; `/optimized/**` holds the
      // build-time responsive images that previously shipped with no cache-control
      // (Lighthouse `cache-insight`).
      //
      // NOTE: Cloudflare `_headers` wildcards (`*`) match across `/` separators and
      // every matching rule is applied (values are concatenated). So we use only
      // non-overlapping directory rules here — an extension rule like `/*.avif`
      // would also match `/optimized/...avif` and corrupt its cache-control header.
      routeRules: {
        "/optimized/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
        "/fonts/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      },
    }),
  ],
});

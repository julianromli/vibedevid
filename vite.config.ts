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
      // `/assets/**` is already handled by the framework; these cover images and
      // fonts that previously shipped with no cache-control (Lighthouse `cache-insight`).
      routeRules: {
        "/optimized/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
        "/fonts/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
        // Root-level public images (e.g. /og-image.png, /default-favicon.svg).
        "/*.png": { headers: { "cache-control": "public, max-age=2592000" } },
        "/*.jpg": { headers: { "cache-control": "public, max-age=2592000" } },
        "/*.svg": { headers: { "cache-control": "public, max-age=2592000" } },
        "/*.webp": { headers: { "cache-control": "public, max-age=2592000" } },
        "/*.avif": { headers: { "cache-control": "public, max-age=2592000" } },
        // Nested public images.
        "/**/*.png": { headers: { "cache-control": "public, max-age=2592000" } },
        "/**/*.jpg": { headers: { "cache-control": "public, max-age=2592000" } },
        "/**/*.svg": { headers: { "cache-control": "public, max-age=2592000" } },
        "/**/*.webp": { headers: { "cache-control": "public, max-age=2592000" } },
        "/**/*.avif": { headers: { "cache-control": "public, max-age=2592000" } },
      },
    }),
  ],
});

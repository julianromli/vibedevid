import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite-plus";

const repoRoot = path.resolve(__dirname, "../..");
const publicRoot = path.resolve(repoRoot, "public");

/** The few public/ files the previews reference by absolute path. */
const PUBLIC_FILES = [
  "V_vibedevid_black.svg",
  "V_vibedevid_white.svg",
  "vibedevid_final_black.svg",
  "vibedevid_final_white.svg",
  "placeholder.svg",
  ...readdirSync(path.join(publicRoot, "optimized"))
    .filter((file) => file.startsWith("hero-vibedevid-showcase-"))
    .map((file) => `optimized/${file}`),
];

/** Dev serves all of public/; the build ships only PUBLIC_FILES. */
function copyPublicSubset(): Plugin {
  return {
    name: "hero-canvas-public-subset",
    apply: "build",
    generateBundle() {
      for (const fileName of PUBLIC_FILES) {
        this.emitFile({
          type: "asset",
          fileName,
          source: readFileSync(path.join(publicRoot, fileName)),
        });
      }
    },
  };
}

/**
 * Hero exploration canvas. A static build: the canvas host (index.html) and
 * one preview document (preview.html) that renders a single hero variant
 * inside an iframe, so 1440 and 390 frames hit real breakpoints.
 */
export default defineConfig(({ command }) => ({
  root: __dirname,
  base: "./",
  publicDir: command === "build" ? false : publicRoot,
  resolve: {
    tsconfigPaths: true,
    alias: [
      // Previews never talk to the auth server.
      {
        find: "@/lib/auth/client",
        replacement: path.resolve(__dirname, "src/preview/auth-stub.ts"),
      },
      // lib/locale.ts reads cookies on the server path; the canvas is static.
      {
        find: "@tanstack/react-start/server",
        replacement: path.resolve(__dirname, "src/preview/start-server-stub.ts"),
      },
    ],
  },
  plugins: [tailwindcss(), viteReact(), copyPublicSubset()],
  server: { port: 5299 },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
        preview: path.resolve(__dirname, "preview.html"),
      },
    },
  },
}));

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const ROOT = join(import.meta.dirname, "../../..");

describe("optimize-images dependencies", () => {
  it("declares sharp so Cloudflare bun install --frozen-lockfile can resolve it", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const declared = Boolean(pkg.devDependencies?.sharp ?? pkg.dependencies?.sharp);
    expect(declared).toBe(true);
  });
});

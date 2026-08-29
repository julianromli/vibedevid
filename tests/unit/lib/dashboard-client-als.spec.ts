import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, isAbsolute, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const ROOT = join(import.meta.dirname, "../../..");
const ENTRY = join(ROOT, "app/routes/_admin/dashboard.tsx");

const RED_SPECS = [
  "@tanstack/react-start/server",
  "@tanstack/start-storage-context",
  "@tanstack/start-server-core",
  "node:async_hooks",
  "async_hooks",
];

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;

function isServerFnBoundary(file: string): boolean {
  return (
    file.endsWith(".functions.ts") ||
    file.endsWith(`${join("app", "(admin)", "dashboard", "dashboard-data.ts")}`) ||
    file.endsWith(`${join("lib", "auth", "admin-gate.ts")}`)
  );
}

function resolveExisting(base: string): string | null {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function resolveLocal(fromFile: string, spec: string): string | null {
  if (spec.startsWith("@/")) {
    return resolveExisting(join(ROOT, spec.slice(2)));
  }
  if (spec.startsWith(".") || isAbsolute(spec)) {
    return resolveExisting(join(dirname(fromFile), spec));
  }
  return null;
}

function isTypeOnlyImport(typeKeyword: string | undefined, clause: string): boolean {
  if (typeKeyword) return true;
  const trimmed = clause.trim();
  if (trimmed.startsWith("type ")) return true;
  if (!trimmed.startsWith("{")) return false;
  const inner = trimmed.slice(1, trimmed.lastIndexOf("}"));
  const parts = inner
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 && parts.every((part) => part.startsWith("type "));
}

function collectSpecs(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const specs: string[] = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    if (isTypeOnlyImport(match[1], match[2])) continue;
    specs.push(match[3]);
  }
  return specs;
}

function rel(file: string): string {
  return file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file;
}

function findAlsLeak(entry = ENTRY): { spec: string; file: string; chain: string } | null {
  const queue = [entry];
  const parent = new Map<string, string | null>([[entry, null]]);

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || isServerFnBoundary(file)) continue;
    const ext = extname(file);
    if (ext !== ".ts" && ext !== ".tsx" && ext !== ".js" && ext !== ".mjs") {
      continue;
    }

    for (const spec of collectSpecs(file)) {
      if (RED_SPECS.some((red) => spec === red || spec.startsWith(`${red}/`))) {
        const chain = [`${spec}  (from ${rel(file)})`];
        let current: string | null = file;
        while (current) {
          chain.push(rel(current));
          current = parent.get(current) ?? null;
        }
        return { spec, file, chain: chain.reverse().join(" -> ") };
      }
      const resolved = resolveLocal(file, spec);
      if (!resolved || parent.has(resolved)) continue;
      parent.set(resolved, file);
      queue.push(resolved);
    }
  }

  return null;
}

describe("admin dashboard client import graph", () => {
  it("does not reach AsyncLocalStorage modules from the dashboard route", () => {
    const leak = findAlsLeak();
    expect(leak, leak ? `client bundle leak: ${leak.chain}` : undefined).toBeNull();
  });
});

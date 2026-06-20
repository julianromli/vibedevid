import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const siteUrl = process.env.DEPLOY_SITE_URL ?? "https://vibedevid.com";
const checkOnly = process.argv.includes("--check") || process.argv.includes("--dry-run");

function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = parseEnvFile(".env.local");

const secrets: Record<string, string> = {
  DATABASE_URL: env.DATABASE_URL ?? "",
  BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ?? "",
  BETTER_AUTH_URL: siteUrl,
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET ?? "",
  GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID ?? "",
  GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET ?? "",
  NEXT_PUBLIC_SITE_URL: siteUrl,
  UPLOADTHING_TOKEN: env.UPLOADTHING_TOKEN ?? "",
  OPENROUTER_API_KEY: env.OPENROUTER_API_KEY ?? "",
  RESEND_API_KEY: env.RESEND_API_KEY ?? "",
  EMAIL_FROM: env.EMAIL_FROM ?? "",
};

const requiredKeys = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "UPLOADTHING_TOKEN",
  "OPENROUTER_API_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
];

for (const key of requiredKeys) {
  if (!secrets[key]) {
    console.error(`Missing required secret value for ${key}`);
    process.exit(1);
  }
}

if (checkOnly) {
  console.log(`All ${requiredKeys.length} required Worker secrets are present locally.`);
  process.exit(0);
}

const tmpPath = ".wrangler-secrets.tmp.json";
writeFileSync(tmpPath, JSON.stringify(secrets));

const result = spawnSync("bunx", ["wrangler", "secret", "bulk", tmpPath], {
  stdio: "inherit",
  shell: true,
});

unlinkSync(tmpPath);
process.exit(result.status ?? 1);

import postgres from "postgres";

const ref = "qabfrhpbfvjcgdrxdlba";
const pass = process.env.SUPABASE_DB_PASSWORD ?? "";
const fromEnv = process.env.SUPABASE_DB_URL;
const encodedPassword = encodeURIComponent(pass);

const urls: Record<string, string> = {
  env: fromEnv ?? "",
  pooler_6543_aws1: encodedPassword
    ? `postgresql://postgres.${ref}:${encodedPassword}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`
    : "",
  pooler_5432_aws1: encodedPassword
    ? `postgresql://postgres.${ref}:${encodedPassword}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require`
    : "",
  direct_ssl: encodedPassword
    ? `postgresql://postgres:${encodedPassword}@db.${ref}.supabase.co:5432/postgres?sslmode=require`
    : "",
  neon: process.env.DATABASE_URL ?? "",
};

// Extract password from SUPABASE_DB_URL if not set separately
if (!pass && fromEnv) {
  try {
    const parsed = new URL(fromEnv);
    if (parsed.password) {
      const parsedPassword = encodeURIComponent(decodeURIComponent(parsed.password));
      urls.pooler_6543 = `postgresql://postgres.${ref}:${parsedPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`;
      urls.pooler_5432 = `postgresql://postgres.${ref}:${parsedPassword}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require`;
      urls.direct_ssl = `postgresql://postgres:${parsedPassword}@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
    }
  } catch {
    // ignore
  }
}

for (const [name, url] of Object.entries(urls)) {
  if (!url) {
    console.log(`${name}: missing`);
    continue;
  }
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 20 });
    const [row] = await sql`SELECT 1 AS ok`;
    console.log(`${name}: OK`, row);
    await sql.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${name}: FAIL`, message);
  }
}

import postgres from "postgres";

const password = process.env.SUPABASE_DB_PASSWORD ?? "";
const ref = "qabfrhpbfvjcgdrxdlba";

const urls = [
  process.env.SUPABASE_DB_URL,
  `postgresql://postgres.${ref}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${password}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
].filter(Boolean) as string[];

for (const url of urls) {
  const label = url.replace(/:[^:@]+@/, ":***@");
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 15, ssl: "require" });
    const r = await sql`SELECT COUNT(*)::int AS c FROM auth.users`;
    console.log("OK", label, "count=", r[0].c);
    await sql.end();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log("FAIL", label, msg.slice(0, 120));
  }
}

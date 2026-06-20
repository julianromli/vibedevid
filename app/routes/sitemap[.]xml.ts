import { createFileRoute } from "@tanstack/react-router";
import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";

/**
 * Static, publicly indexable routes. Auth-gated pages (e.g. `/user/auth`,
 * `/project/submit`) are intentionally excluded — they redirect or render thin
 * login UI and should not be in the sitemap.
 */
const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "", priority: "1.0", changefreq: "daily" },
  { path: "/project/list", priority: "0.8", changefreq: "daily" },
  { path: "/blog", priority: "0.8", changefreq: "daily" },
  { path: "/event/list", priority: "0.7", changefreq: "daily" },
  { path: "/calendar", priority: "0.5", changefreq: "weekly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms-of-service", priority: "0.3", changefreq: "yearly" },
];

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIso(value: unknown, fallback: string): string {
  if (typeof value === "string" && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return fallback;
}

/**
 * Fetches dynamic content URLs (published blog posts, projects, approved
 * events, and public user profiles) so search engines can discover every
 * rankable page rather than only the static routes.
 */
async function getDynamicEntries(base: string, fallbackIso: string): Promise<SitemapEntry[]> {
  try {
    const supabase = await createClient();

    const [posts, projects, events, users] = await Promise.all([
      supabase.from("posts").select("slug, updated_at, published_at").eq("status", "published"),
      supabase.from("projects").select("slug, updated_at"),
      supabase.from("events").select("slug, updated_at, created_at").eq("approved", true),
      supabase.from("users").select("username, updated_at").not("username", "is", null),
    ]);

    const postEntries = (posts.data ?? [])
      .filter((row) => row.slug)
      .map((row) => ({
        loc: `${base}/blog/${row.slug}`,
        lastmod: toIso(row.updated_at ?? row.published_at, fallbackIso),
        changefreq: "weekly",
        priority: "0.7",
      }));

    const projectEntries = (projects.data ?? [])
      .filter((row) => row.slug)
      .map((row) => ({
        loc: `${base}/project/${row.slug}`,
        lastmod: toIso(row.updated_at, fallbackIso),
        changefreq: "weekly",
        priority: "0.6",
      }));

    const eventEntries = (events.data ?? [])
      .filter((row) => row.slug)
      .map((row) => ({
        loc: `${base}/event/${row.slug}`,
        lastmod: toIso(row.updated_at ?? row.created_at, fallbackIso),
        changefreq: "weekly",
        priority: "0.6",
      }));

    const userEntries = (users.data ?? [])
      .filter((row) => row.username)
      .map((row) => ({
        loc: `${base}/${row.username}`,
        lastmod: toIso(row.updated_at, fallbackIso),
        changefreq: "weekly",
        priority: "0.4",
      }));

    return [...postEntries, ...projectEntries, ...eventEntries, ...userEntries];
  } catch {
    // Never fail the sitemap response on a query error — fall back to the
    // static routes so the document stays valid and crawlable.
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const base = getSiteUrl().replace(/\/$/, "");
        const fallbackIso = new Date().toISOString();

        const staticEntries: SitemapEntry[] = STATIC_ROUTES.map((route) => ({
          loc: `${base}${route.path}`,
          lastmod: fallbackIso,
          changefreq: route.changefreq,
          priority: route.priority,
        }));

        const dynamicEntries = await getDynamicEntries(base, fallbackIso);
        const allEntries = [...staticEntries, ...dynamicEntries];

        const urls = allEntries
          .map(
            (entry) =>
              `<url><loc>${escapeXml(entry.loc)}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
          )
          .join("");

        const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});

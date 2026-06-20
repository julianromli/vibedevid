import { createFileRoute } from "@tanstack/react-router";
import { eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { events, posts, projects, users } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/seo/site-url";

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
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string" && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return fallback;
}

async function getDynamicEntries(base: string, fallbackIso: string): Promise<SitemapEntry[]> {
  try {
    const db = getDb();

    const [postRows, projectRows, eventRows, userRows] = await Promise.all([
      db
        .select({ slug: posts.slug, updatedAt: posts.updatedAt, publishedAt: posts.publishedAt })
        .from(posts)
        .where(eq(posts.status, "published")),
      db.select({ slug: projects.slug, updatedAt: projects.updatedAt }).from(projects),
      db
        .select({ slug: events.slug, updatedAt: events.updatedAt, createdAt: events.createdAt })
        .from(events)
        .where(eq(events.approved, true)),
      db
        .select({ username: users.username, updatedAt: users.updatedAt })
        .from(users)
        .where(isNotNull(users.username)),
    ]);

    const postEntries = postRows
      .filter((row) => row.slug)
      .map((row) => ({
        loc: `${base}/blog/${row.slug}`,
        lastmod: toIso(row.updatedAt ?? row.publishedAt, fallbackIso),
        changefreq: "weekly",
        priority: "0.7",
      }));

    const projectEntries = projectRows
      .filter((row) => row.slug)
      .map((row) => ({
        loc: `${base}/project/${row.slug}`,
        lastmod: toIso(row.updatedAt, fallbackIso),
        changefreq: "weekly",
        priority: "0.6",
      }));

    const eventEntries = eventRows
      .filter((row) => row.slug)
      .map((row) => ({
        loc: `${base}/event/${row.slug}`,
        lastmod: toIso(row.updatedAt ?? row.createdAt, fallbackIso),
        changefreq: "weekly",
        priority: "0.6",
      }));

    const userEntries = userRows
      .filter((row) => row.username)
      .map((row) => ({
        loc: `${base}/${row.username}`,
        lastmod: toIso(row.updatedAt, fallbackIso),
        changefreq: "weekly",
        priority: "0.4",
      }));

    return [...postEntries, ...projectEntries, ...eventEntries, ...userEntries];
  } catch {
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

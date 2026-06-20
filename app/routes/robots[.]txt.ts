import { createFileRoute } from "@tanstack/react-router";
import { getSiteUrl } from "@/lib/seo/site-url";

/**
 * Private / non-indexable path prefixes. These either require auth, render
 * thin UI, or are API endpoints — none should appear in search results.
 */
const DISALLOWED_PATHS = [
  "/admin",
  "/dashboard",
  "/blog/editor",
  "/project/submit",
  "/user/auth",
  "/api/",
  "/auth/",
];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const base = getSiteUrl().replace(/\/$/, "");

        const lines = [
          "User-agent: *",
          "Allow: /",
          ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
          "",
          `Sitemap: ${base}/sitemap.xml`,
          `Host: ${base}`,
        ];

        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});

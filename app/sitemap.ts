import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://vibedevid.com").replace(/\/$/, "")

  // Static core routes. Add dynamic routes (projects/users) here if desired.
  const routes = [
    "",
    "/project/list",
    "/project/submit",
    "/user/auth",
    "/terms",
    "/calendar",
    "/ai/ranking",
  ]

  const now = new Date()
  return routes.map((path) => ({
    url: `${base}${path}` || base,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }))
}


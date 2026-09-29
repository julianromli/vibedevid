import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vite-plus/test";
import { ProjectUpdateSchema } from "@/lib/actions/admin/schemas";
import { projects } from "@/lib/db/schema";
import { alignProjectImages } from "@/lib/project-images";
import { softwareApplicationSchema } from "@/lib/seo/schema-templates";
import type { ProjectDetail } from "@/lib/server/project-public";

const detail: ProjectDetail = {
  id: 1,
  slug: "demo",
  title: "Demo",
  description: "A demo project for the community.",
  fullDescription: "A demo project for the community.",
  image: "https://utfs.io/f/shot",
  imageUrls: ["https://utfs.io/f/shot"],
  author: {
    name: "Ada",
    username: "ada",
    role: 2,
    avatar: "/placeholder.svg",
    bio: "Builder",
    location: "Jakarta",
  },
  url: "https://example.com",
  category: "SaaS",
  categoryRaw: "saas",
  tagline: "A short tagline",
  faviconUrl: "/default-favicon.svg",
  tags: ["ai"],
  likes: 12,
  views: 3,
  uniqueViews: 2,
  todayViews: 1,
  createdAt: "2026-08-01T00:00:00.000Z",
};

describe("project list indexes", () => {
  it("defines created_at indexes for the list order", () => {
    const names = getTableConfig(projects).indexes.map((index) => index.config.name);
    expect(names).toContain("idx_projects_created_at");
    expect(names).toContain("idx_projects_category_created_at");
  });
});

describe("project image ownership", () => {
  it("refuses a key that belongs to another account", () => {
    const result = alignProjectImages({
      submittedUrls: ["https://utfs.io/f/victim"],
      submittedKeys: ["victim-key"],
      knownUploads: [
        {
          key: "victim-key",
          url: "https://utfs.io/f/victim",
          userId: "someone-else",
          projectId: null,
        },
      ],
      actorUserId: "me",
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result.ok).toBe(false);
  });
});

describe("admin project update schema", () => {
  it("accepts a title patch and rejects a bad website", () => {
    expect(ProjectUpdateSchema.safeParse({ title: "Renamed" }).success).toBe(true);
    expect(ProjectUpdateSchema.safeParse({ website_url: "not a url" }).success).toBe(false);
  });
});

describe("softwareApplicationSchema", () => {
  it("uses the screenshot and does not invent a rating or download", () => {
    const schema = softwareApplicationSchema(detail);
    expect(schema.screenshot).toBe("https://utfs.io/f/shot");
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(schema).not.toHaveProperty("downloadUrl");
  });
});

import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { fetchProjectsWithSorting, getProjectBySlug } from "@/lib/server/project-public";
import { makeFakeDb } from "@/tests/unit/lib/fake-db";

/**
 * Shape-regression tests for the Project read module.
 *
 * No database connection: `@/lib/db`, `@/lib/categories`, and
 * `@/lib/server/auth` are mocked at the module seam. The tests lock the
 * *interface contract* the route loaders and presentational components
 * depend on — success shapes, absence (`null`/`[]`), and the rule that
 * database failures THROW rather than degrade into bogus empty reads.
 */

const UUID = "0f47d16c-3c2a-4e8e-b9b2-7e8d1f9a11aa";

// A `ProjectRow` as produced by the projects table (camelCase Drizzle keys).
const projectRow = {
  id: 7,
  slug: "pijar-mahir",
  title: "Pijar Mahir",
  description: "A learning platform",
  category: "education",
  websiteUrl: null,
  imageUrl: null,
  imageUrls: ["https://img.example.com/1.png", "https://img.example.com/2.png"],
  imageKeys: ["key-1", "key-2"],
  tags: ["edtech"],
  tagline: null,
  faviconUrl: null,
  authorId: UUID,
  featured: false,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  updatedAt: new Date("2026-08-01T00:00:00Z"),
};

const h = vi.hoisted(() => {
  const state: {
    countQueue: number[];
    selectRows: unknown[];
    batchLikes: unknown[];
    failKeys: string[];
    batchFail: boolean;
  } = {
    countQueue: [],
    selectRows: [],
    batchLikes: [],
    failKeys: [],
    batchFail: false,
  };

  function resolveRows(selection: Record<string, unknown> | undefined): unknown[] {
    const keys = Object.keys(selection ?? {});
    if (state.failKeys.some((key) => keys.includes(key))) {
      throw new Error("mocked db failure");
    }
    if (keys.includes("value")) {
      return [{ value: state.countQueue.shift() ?? 0 }];
    }
    if (keys.includes("projectId")) {
      if (state.batchFail) {
        throw new Error("mocked likes query failure");
      }
      return state.batchLikes;
    }
    return state.selectRows;
  }

  return { state, resolveRows, createMockDb: () => makeFakeDb(resolveRows) };
});

vi.mock("@/lib/db", () => ({
  getDb: () => h.createMockDb(),
}));

vi.mock("@/lib/categories", () => ({
  getCategories: vi.fn(async () => [
    {
      id: "cat-1",
      name: "education",
      display_name: "Education",
      sort_order: 1,
      is_active: true,
    },
  ]),
  getCategoryDisplayName: vi.fn(async (name: string) =>
    name === "education" ? "Education" : name,
  ),
}));

vi.mock("@/lib/server/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: null })),
}));

beforeEach(() => {
  h.state.countQueue = [];
  h.state.selectRows = [];
  h.state.batchLikes = [];
  h.state.failKeys = [];
  h.state.batchFail = false;
});

describe("getProjectBySlug — detail read", () => {
  it("returns the project shape the detail page consumes", async () => {
    h.state.selectRows = [
      {
        project: projectRow,
        authorUsername: "jane",
        authorDisplayName: "Jane Doe",
        authorAvatarUrl: null,
        authorRole: 2,
        authorBio: "Bio",
        authorLocation: "Jakarta",
      },
    ];
    h.state.countQueue = [12, 345, 200, 3]; // likes, total views, unique views, today views

    const project = await getProjectBySlug("pijar-mahir");

    expect(project).not.toBeNull();
    expect(project!.id).toBe(7);
    expect(project!.slug).toBe("pijar-mahir");
    expect(project!.author).toEqual({
      name: "Jane Doe",
      username: "jane",
      role: 2,
      avatar: "/placeholder.svg",
      bio: "Bio",
      location: "Jakarta",
    });
    expect(project!.category).toBe("Education"); // display name resolved
    expect(project!.categoryRaw).toBe("education");
    expect(project!.likes).toBe(12);
    expect(project!.views).toBe(345);
    expect(project!.uniqueViews).toBe(200);
    expect(project!.todayViews).toBe(3);
    expect(project!.imageUrls).toEqual([
      "https://img.example.com/1.png",
      "https://img.example.com/2.png",
    ]);
    expect(project!.imageKeys).toEqual(["key-1", "key-2"]);
    expect(project!.tags).toEqual(["edtech"]);
    expect(project!.createdAt).toBe("2026-08-01T00:00:00.000Z");
  });

  it("returns null for an empty slug without touching the database", async () => {
    await expect(getProjectBySlug("   ")).resolves.toBeNull();
  });

  it("returns null when no project matches the slug", async () => {
    h.state.selectRows = [];

    await expect(getProjectBySlug("missing")).resolves.toBeNull();
  });

  it("throws when the database rejects", async () => {
    h.state.failKeys = ["project"];

    await expect(getProjectBySlug("pijar-mahir")).rejects.toThrow("mocked db failure");
  });
});

describe("fetchProjectsWithSorting — list read", () => {
  const otherProject = {
    ...projectRow,
    id: 8,
    slug: "other-project",
    title: "Other",
    category: "education",
    imageUrls: null,
    tags: [],
    createdAt: new Date("2026-07-01T00:00:00Z"),
  };

  it("returns the list-card shape with display-name categories", async () => {
    h.state.selectRows = [
      {
        project: { ...projectRow, createdAt: new Date("2026-08-01T00:00:00Z") },
        authorUsername: "jane",
        authorDisplayName: "Jane Doe",
        authorAvatarUrl: null,
        authorRole: 2,
      },
      {
        project: otherProject,
        authorUsername: "bob",
        authorDisplayName: "Bob",
        authorAvatarUrl: "/bob.png",
        authorRole: null,
      },
    ];
    h.state.batchLikes = [
      { projectId: 8, userId: UUID },
      { projectId: 8, userId: "other" },
    ];

    const projects = await fetchProjectsWithSorting("newest", "education", 20);

    expect(projects).toHaveLength(2);
    // Newest first: "pijar-mahir" is newer (Aug 1) than "other-project" (Jul 1).
    expect(projects[0].slug).toBe("pijar-mahir");
    expect(projects[0].createdAt).toBe("2026-08-01T00:00:00.000Z");

    const card = projects[1];
    expect(card.category).toBe("Education");
    expect(card.likes).toBe(2);
    expect(card.views).toBe(0); // list cards carry a placeholder view count
    expect(card.image).toBeNull(); // imageUrls null + imageUrl null → primary image null
    expect(card.author).toEqual({
      name: "Bob",
      username: "bob",
      role: null,
      avatar: "/bob.png",
    });
  });

  it("orders by likes desc for the top sort", async () => {
    h.state.selectRows = [
      {
        project: projectRow, // 1 like incoming below
        authorUsername: "jane",
        authorDisplayName: "Jane Doe",
        authorAvatarUrl: null,
        authorRole: 2,
      },
      {
        project: otherProject,
        authorUsername: "bob",
        authorDisplayName: "Bob",
        authorAvatarUrl: null,
        authorRole: 2,
      },
    ];
    h.state.batchLikes = [{ projectId: 7, userId: UUID }]; // only pijar-mahir has a like

    const projects = await fetchProjectsWithSorting("top", undefined, 20);

    expect(projects.map((p) => p.slug)).toEqual(["pijar-mahir", "other-project"]);
    expect(projects[0].likes).toBe(1);
  });

  it("returns an empty list when there are no projects", async () => {
    h.state.selectRows = [];

    await expect(fetchProjectsWithSorting("newest", undefined, 20)).resolves.toEqual([]);
  });

  it("throws when the projects query rejects", async () => {
    h.state.failKeys = ["project"];

    await expect(fetchProjectsWithSorting("newest", undefined, 20)).rejects.toThrow(
      "mocked db failure",
    );
  });

  it("degrades to zeroed likes when only the likes query fails", async () => {
    h.state.selectRows = [
      {
        project: projectRow,
        authorUsername: "jane",
        authorDisplayName: "Jane Doe",
        authorAvatarUrl: null,
        authorRole: 2,
      },
    ];
    h.state.batchFail = true;

    const projects = await fetchProjectsWithSorting("newest", undefined, 20);

    expect(projects).toHaveLength(1);
    expect(projects[0].likes).toBe(0);
  });
});

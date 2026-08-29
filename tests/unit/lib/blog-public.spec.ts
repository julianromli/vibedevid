import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { fetchPostDetailBySlug, fetchPublishedPosts } from "@/lib/server/blog-public";
import { makeFakeDb } from "@/tests/unit/lib/fake-db";

/**
 * Shape-regression tests for the Blog read module. Mock the `@/lib/db` seam
 * and lock the wire contracts of both public reads.
 */

const UUID = "0f47d16c-3c2a-4e8e-b9b2-7e8d1f9a11aa";

const postRow = {
  id: UUID,
  title: "Migrating to TanStack Start",
  slug: "migrating-to-tanstack-start",
  content: { type: "doc", content: [] },
  excerpt: "How we moved",
  coverImage: "https://img.example.com/cover.png",
  authorId: "author-uuid",
  status: "published",
  publishedAt: new Date("2026-08-01T00:00:00Z"),
  createdAt: new Date("2026-07-01T00:00:00Z"),
  updatedAt: new Date("2026-08-01T00:00:00Z"),
  readTimeMinutes: 5,
  viewCount: 42,
  featured: true,
};

const authorRow = {
  id: "author-uuid",
  username: "jane",
  displayName: "Jane Doe",
  bio: "Engineering",
  avatarUrl: "https://img.example.com/jane.png",
  location: "Jakarta",
  website: null,
  githubUrl: null,
  twitterUrl: null,
  xUrl: null,
  instagramUrl: null,
  threadsUrl: null,
  role: 2,
  isSuspended: false,
  joinedAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const h = vi.hoisted(() => {
  const state: {
    detailRows: unknown[];
    listRows: unknown[];
    tagRows: unknown[];
    countQueue: number[];
    failKeys: string[];
  } = {
    detailRows: [],
    listRows: [],
    tagRows: [],
    countQueue: [],
    failKeys: [],
  };

  function resolveRows(selection: Record<string, unknown> | undefined): unknown[] {
    const keys = Object.keys(selection ?? {});
    if (state.failKeys.some((key) => keys.includes(key))) {
      throw new Error("mocked db failure");
    }
    if (keys.includes("count")) {
      return [{ count: state.countQueue.shift() ?? 0 }];
    }
    if (keys.includes("value")) {
      return [{ value: state.countQueue.shift() ?? 0 }];
    }
    if (keys.includes("tagName")) {
      return state.tagRows;
    }
    if (keys.includes("authorDisplayName")) {
      return state.listRows;
    }
    return state.detailRows;
  }

  return { state, resolveRows };
});

vi.mock("@/lib/db", () => ({
  getDb: () => makeFakeDb(h.resolveRows),
}));

beforeEach(() => {
  h.state.detailRows = [];
  h.state.listRows = [];
  h.state.tagRows = [];
  h.state.countQueue = [];
  h.state.failKeys = [];
});

describe("fetchPostDetailBySlug — detail read", () => {
  it("returns the wire shape the blog.$slug route consumed", async () => {
    h.state.detailRows = [{ post: postRow, author: authorRow }];
    h.state.tagRows = [
      { postId: UUID, tagName: "tanstack" },
      { postId: UUID, tagName: "migration" },
    ];
    h.state.countQueue = [42];

    const result = await fetchPostDetailBySlug("migrating-to-tanstack-start");

    expect(result).not.toBeNull();
    const { post, viewCount } = result!;

    expect(viewCount).toBe(42);
    expect(post.id).toBe(UUID);
    expect(post.title).toBe("Migrating to TanStack Start");
    expect(post.slug).toBe("migrating-to-tanstack-start");
    expect(post.content).toEqual({ type: "doc", content: [] });
    expect(post.cover_image).toBe("https://img.example.com/cover.png");
    expect(post.status).toBe("published");
    expect(post.read_time_minutes).toBe(5);
    expect(post.featured).toBe(true);

    // Author uses the typed wire shape
    expect(post.author).not.toBeNull();
    expect(post.author!.display_name).toBe("Jane Doe");
    expect(post.author!.avatar_url).toBe("https://img.example.com/jane.png");

    // Tags use the nested post_tags wire shape
    expect(post.tags).toEqual([
      { post_tags: { name: "tanstack" } },
      { post_tags: { name: "migration" } },
    ]);
  });

  it("returns null for a missing post", async () => {
    h.state.detailRows = [];
    await expect(fetchPostDetailBySlug("nope")).resolves.toBeNull();
  });

  it("returns null for a draft post", async () => {
    h.state.detailRows = [{ post: { ...postRow, status: "draft" }, author: authorRow }];
    await expect(fetchPostDetailBySlug("migrating-to-tanstack-start")).resolves.toBeNull();
  });

  it("propagates database failures instead of returning null", async () => {
    h.state.failKeys = ["post"];
    await expect(fetchPostDetailBySlug("migrating-to-tanstack-start")).rejects.toThrow();
  });
});

describe("fetchPublishedPosts — list read", () => {
  it("returns the list-card shape via the shared tag helper", async () => {
    h.state.listRows = [
      {
        post: postRow,
        authorDisplayName: "Jane Doe",
        authorAvatarUrl: "https://img.example.com/jane.png",
      },
    ];
    h.state.tagRows = [{ postId: UUID, tagName: "tanstack" }];

    const result = await fetchPublishedPosts();

    expect(result).toHaveLength(1);
    const [card] = result;
    expect(card.id).toBe(UUID);
    expect(card.title).toBe("Migrating to TanStack Start");
    expect(card.excerpt).toBe("How we moved");
    expect(card.cover_image).toBe("https://img.example.com/cover.png");
    expect(card.published_at).toBe("2026-08-01T00:00:00.000Z");
    expect(card.read_time_minutes).toBe(5);
    expect(card.author).toEqual({
      display_name: "Jane Doe",
      avatar_url: "https://img.example.com/jane.png",
    });
    expect(card.tags).toEqual([{ post_tags: { name: "tanstack" } }]);
  });

  it("returns an empty list when there are no published posts", async () => {
    h.state.listRows = [];
    await expect(fetchPublishedPosts()).resolves.toEqual([]);
  });
});

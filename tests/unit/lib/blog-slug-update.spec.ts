import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { updateBlogPost } from "@/lib/actions/blog";
import { makeQueryChain } from "./fake-db";

const state = vi.hoisted(() => ({
  post: {
    authorId: "author",
    title: "Hello World",
    status: "published",
    slug: "hello-world-original",
  },
  candidates: [{ slug: "hello-world" }],
  writes: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/server/auth", () => ({
  getServerSession: async () => ({ user: { id: "author" } }),
}));

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: (selection: Record<string, unknown>) => {
      const rows =
        Object.keys(selection).length === 1 && "slug" in selection
          ? state.candidates
          : [
              Object.fromEntries(
                Object.keys(selection).map((key) => [
                  key,
                  state.post[key as keyof typeof state.post],
                ]),
              ),
            ];
      return makeQueryChain(selection, () => rows);
    },
    update: () => ({
      set: (patch: Record<string, unknown>) => ({
        where: async () => {
          state.writes.push(patch);
          Object.assign(state.post, patch);
        },
      }),
    }),
  }),
}));

beforeEach(() => {
  state.post = {
    authorId: "author",
    title: "Hello World",
    status: "published",
    slug: "hello-world-original",
  };
  state.candidates = [{ slug: "hello-world" }];
  state.writes = [];
});

describe("blog slug updates", () => {
  it("preserves a collision suffix when saving content with an unchanged title", async () => {
    const result = await updateBlogPost("post-id", { title: "Hello World", excerpt: "Edited" });
    expect(result).toEqual({ success: true, slug: "hello-world-original" });
    expect(state.writes[0]).not.toHaveProperty("slug");
  });

  it("preserves the public URL across repeated saves and publishing", async () => {
    state.post.status = "draft";
    for (const status of ["draft", "published", "published"] as const) {
      const result = await updateBlogPost("post-id", { title: "Hello World", status });
      expect(result).toEqual({ success: true, slug: "hello-world-original" });
    }
    expect(state.post.slug).toBe("hello-world-original");
    expect(state.post.status).toBe("published");
  });

  it("preserves a suffix even after the base slug becomes available", async () => {
    state.candidates = [];
    expect(await updateBlogPost("post-id", { title: "Hello World" })).toEqual({
      success: true,
      slug: "hello-world-original",
    });
  });

  it("preserves the slug when the patch omits the title", async () => {
    expect(await updateBlogPost("post-id", { excerpt: "Edited" })).toEqual({
      success: true,
      slug: "hello-world-original",
    });
  });

  it("regenerates the slug when the title really changes", async () => {
    state.candidates = [];
    expect(await updateBlogPost("post-id", { title: "New title" })).toEqual({
      success: true,
      slug: "new-title",
    });
    expect(state.post.slug).toBe("new-title");
  });

  it("retains collision handling when renaming", async () => {
    state.candidates = [{ slug: "new-title" }];
    const result = await updateBlogPost("post-id", { title: "New title" });
    expect(result.success).toBe(true);
    expect(result.slug).toMatch(/^new-title-[a-z0-9]+$/);
  });
});

import { describe, expect, it } from "vite-plus/test";
import {
  assertSeedFixtures,
  SEED_CATEGORIES,
  SEED_COMMENTS,
  SEED_EVENTS,
  SEED_LIKES,
  SEED_POSTS,
  SEED_PROJECTS,
  SEED_REPORTS,
  SEED_USERS,
  SEED_VIEWS,
} from "@/scripts/seed/fixtures";

describe("seed fixtures", () => {
  it("passes invariant checks", () => {
    expect(() => assertSeedFixtures()).not.toThrow();
  });

  it("uses gmail.com emails and valid roles", () => {
    expect(SEED_USERS.map((user) => user.role).sort()).toEqual([0, 1, 2, 2]);
    for (const user of SEED_USERS) {
      expect(user.email.endsWith("@gmail.com")).toBe(true);
    }
  });

  it("keeps slugs unique and categories known", () => {
    const categoryNames = new Set(SEED_CATEGORIES.map((category) => category.name));
    expect(new Set(SEED_PROJECTS.map((project) => project.slug)).size).toBe(SEED_PROJECTS.length);
    expect(new Set(SEED_POSTS.map((post) => post.slug)).size).toBe(SEED_POSTS.length);
    expect(new Set(SEED_EVENTS.map((event) => event.slug)).size).toBe(SEED_EVENTS.length);
    for (const project of SEED_PROJECTS) {
      expect(categoryNames.has(project.category)).toBe(true);
    }
  });

  it("sets exactly one parent on comments, likes, and views", () => {
    for (const row of [...SEED_COMMENTS, ...SEED_LIKES, ...SEED_VIEWS]) {
      expect(Boolean(row.projectSlug) !== Boolean(row.postSlug)).toBe(true);
    }
  });

  it("points reports at seed comments", () => {
    const commentIds = new Set(SEED_COMMENTS.map((comment) => comment.id));
    for (const report of SEED_REPORTS) {
      expect(commentIds.has(report.commentId)).toBe(true);
    }
  });
});

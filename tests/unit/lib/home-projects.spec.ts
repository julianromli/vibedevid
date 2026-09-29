import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { loadHomeProjects } from "@/lib/server/home-projects";

const fetchProjectPage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/project-public", () => ({
  fetchProjectPage,
}));

beforeEach(() => {
  fetchProjectPage.mockReset();
});

describe("loadHomeProjects", () => {
  it("returns the project page when the query succeeds", async () => {
    const projects = [{ id: 1, slug: "demo", title: "Demo" }];
    fetchProjectPage.mockResolvedValue({ projects, nextCursor: "next" });

    await expect(loadHomeProjects("newest", undefined)).resolves.toEqual({
      projects,
      nextCursor: "next",
    });
    expect(fetchProjectPage).toHaveBeenCalledWith({
      sortBy: "newest",
      category: undefined,
      limit: 18,
    });
  });

  it("returns an empty page when the query throws", async () => {
    fetchProjectPage.mockRejectedValue(new Error("connection refused"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadHomeProjects("trending", "saas")).resolves.toEqual({
      projects: [],
      nextCursor: null,
    });
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

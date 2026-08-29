import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { loadHomeProjects } from "@/lib/server/home-projects";

const fetchProjectsWithSorting = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/project-public", () => ({
  fetchProjectsWithSorting,
}));

beforeEach(() => {
  fetchProjectsWithSorting.mockReset();
});

describe("loadHomeProjects", () => {
  it("returns the project list when the query succeeds", async () => {
    const projects = [{ id: 1, slug: "demo", title: "Demo" }];
    fetchProjectsWithSorting.mockResolvedValue(projects);

    await expect(loadHomeProjects("newest", undefined)).resolves.toEqual(projects);
    expect(fetchProjectsWithSorting).toHaveBeenCalledWith("newest", undefined, 20);
  });

  it("returns an empty list when the query throws", async () => {
    fetchProjectsWithSorting.mockRejectedValue(new Error("connection refused"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadHomeProjects("trending", "saas")).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

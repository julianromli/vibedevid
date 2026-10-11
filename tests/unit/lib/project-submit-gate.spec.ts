import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";
import {
  PROJECT_SUBMIT_PATH,
  resolveProjectSubmitLoaderData,
} from "@/lib/routes/project-submit-gate";

describe("resolveProjectSubmitLoaderData", () => {
  it("turns an unauthenticated result into an auth redirect", () => {
    expect.assertions(3);

    try {
      resolveProjectSubmitLoaderData({ status: "unauthenticated" });
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
      if (!isRedirect(error)) return;
      expect(error.options.to).toBe("/user/auth");
      expect(error.options.search).toEqual({ redirectTo: PROJECT_SUBMIT_PATH });
    }
  });

  it("returns loader data for an authenticated result", () => {
    const categories = [
      {
        id: "cat-1",
        name: "tools",
        display_name: "Tools",
        sort_order: 1,
        is_active: true,
      },
    ];

    expect(
      resolveProjectSubmitLoaderData({
        status: "ok",
        userId: "user-1",
        categories,
      }),
    ).toEqual({
      userId: "user-1",
      categories,
      redirectTo: PROJECT_SUBMIT_PATH,
    });
  });
});

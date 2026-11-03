import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vite-plus/test";

let status = "idle";
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (state: { status: string }) => unknown }) =>
    select({ status }),
}));

const { NavigationProgress } = await import("@/components/ui/navigation-progress");

describe("NavigationProgress", () => {
  it("shows a progress bar while a navigation is pending", () => {
    status = "pending";
    render(React.createElement(NavigationProgress));
    expect(screen.getByRole("progressbar", { name: "loadingPage" })).toBeInTheDocument();
  });

  it("renders nothing when the router is idle", () => {
    status = "idle";
    render(React.createElement(NavigationProgress));
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});

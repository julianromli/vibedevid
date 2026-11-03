import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vite-plus/test";

let status = "idle";
let hydrated = true;
vi.mock("@tanstack/react-router", () => ({
  useHydrated: () => hydrated,
  useRouterState: ({ select }: { select: (state: { status: string }) => unknown }) =>
    select({ status }),
}));

const { NavigationProgress } = await import("@/components/ui/navigation-progress");

describe("NavigationProgress", () => {
  it("shows a progress bar and announces it while a navigation is pending", () => {
    status = "pending";
    hydrated = true;
    const { container } = render(React.createElement(NavigationProgress));
    expect(screen.getByRole("progressbar", { name: "loadingPage" })).toBeInTheDocument();
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent("loadingPage");
  });

  it("renders nothing when the router is idle", () => {
    status = "idle";
    hydrated = true;
    const { container } = render(React.createElement(NavigationProgress));
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(container.querySelector('[aria-live="polite"]')).toBeEmptyDOMElement();
  });

  it("renders no bar before hydration even though the server router is pending", () => {
    status = "pending";
    hydrated = false;
    render(React.createElement(NavigationProgress));
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});

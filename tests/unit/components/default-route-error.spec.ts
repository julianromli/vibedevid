import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vite-plus/test";
import { DefaultRouteError } from "@/components/errors/default-route-error";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) =>
    React.createElement("a", { href: to, ...props }, children),
}));

describe("DefaultRouteError", () => {
  it("renders recovery actions without throwing on a non-string error message", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(DefaultRouteError, {
        error: { message: { code: 500 } } as unknown as Error,
        reset: () => {},
      }),
    );

    expect(screen.getByRole("heading", { name: "500" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");

    await user.click(screen.getByRole("button", { name: "Show details" }));

    expect(screen.getByText("The page failed to load.")).toBeInTheDocument();
  });
});

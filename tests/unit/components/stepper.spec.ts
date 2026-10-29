import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { Stepper } from "@/components/ui/stepper";
import i18n from "@/i18n";

const steps = [
  { id: "source", title: "Source" },
  { id: "basics", title: "Basics" },
  { id: "links", title: "Links & media" },
  { id: "review", title: "Review" },
];

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("Stepper", () => {
  it("marks the current step and lets only completed steps be clicked", () => {
    const onSelect = vi.fn();
    render(React.createElement(Stepper, { steps, currentStep: 2, onSelect }));

    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[0]).not.toHaveAttribute("aria-current");

    fireEvent.click(within(items[0] as HTMLElement).getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(0);
    expect(within(items[2] as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
    expect(within(items[3] as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
    expect(items[3]).toHaveTextContent("Step 4 of 4, Review, not started");
  });

  it("disables going back while locked", () => {
    const onSelect = vi.fn();
    render(React.createElement(Stepper, { steps, currentStep: 2, onSelect, locked: true }));

    const first = screen.getAllByRole("listitem")[0] as HTMLElement;
    expect(within(first).getByRole("button")).toBeDisabled();
  });
});

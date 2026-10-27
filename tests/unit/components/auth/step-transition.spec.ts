import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { STEP_EXIT_MS, StepTransition } from "@/components/auth/step-transition";

const step = (key: string, text: string) =>
  React.createElement(
    StepTransition as React.FC<{ stepKey: string; children?: React.ReactNode }>,
    { stepKey: key },
    React.createElement("p", null, text),
  );

describe("StepTransition", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps the old step on screen, inert and fading, before showing the new one", () => {
    const { rerender } = render(step("email", "email step"));
    expect(screen.getByText("email step").parentElement).not.toHaveAttribute("data-leaving");

    rerender(step("code", "code step"));
    const wrapper = screen.getByText("email step").parentElement;
    expect(wrapper).toHaveAttribute("data-leaving", "true");
    expect(wrapper).toHaveClass("animate-auth-step-out");
    expect(wrapper).toHaveAttribute("inert");
    expect(screen.queryByText("code step")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(STEP_EXIT_MS);
    });
    expect(screen.getByText("code step").parentElement).not.toHaveAttribute("data-leaving");
    expect(screen.queryByText("email step")).toBeNull();
  });

  it("updates the current step in place when the key does not change", () => {
    const { rerender } = render(step("email", "first"));
    rerender(step("email", "second"));
    expect(screen.getByText("second").parentElement).not.toHaveAttribute("data-leaving");
  });
});

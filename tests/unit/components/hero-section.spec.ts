import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { HeroSection } from "@/components/sections/hero-section";

const { messages, translatorRef } = vi.hoisted(() => {
  const baseMessages = {
    announcement: "Announcement",
    readLatest: "Read latest",
    subtitle: "Ship faster with the community.",
    joinCommunity: "Join community",
    ourShowcase: "Our showcase",
    titleLine1: "Build",
    titleLine2: "Products",
  };

  return {
    messages: { ...baseMessages },
    translatorRef: {
      current: (key: keyof typeof baseMessages) => baseMessages[key],
    },
  };
});

function resetMessages() {
  Object.assign(messages, {
    announcement: "Announcement",
    readLatest: "Read latest",
    subtitle: "Ship faster with the community.",
    joinCommunity: "Join community",
    ourShowcase: "Our showcase",
    titleLine1: "Build",
    titleLine2: "Products",
  });
  translatorRef.current = (key: keyof typeof messages) => messages[key];
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: keyof typeof messages) => translatorRef.current(key),
    i18n: { language: "en" },
  }),
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => "en",
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) =>
    React.createElement("a", { href: to, ...props }, children),
}));

vi.mock("@/components/ui/animated-gradient-text", () => ({
  AnimatedGradientText: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("div", { className }, children),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    React.createElement("button", { type: "button", ...props }, children),
}));

vi.mock("@/components/ui/logo-marquee", () => ({
  LogoMarquee: () => React.createElement("div", null, "Logo marquee"),
}));

vi.mock("@/components/ui/optimized-image", () => ({
  OptimizedImage: ({
    variantWidths: _variantWidths,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    variantWidths?: number[];
    priority?: boolean;
  }) => React.createElement("img", props),
}));

vi.mock("@/components/ui/safari-mockup", () => ({
  SafariMockup: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

describe("HeroSection", () => {
  beforeEach(() => {
    resetMessages();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders the animated title words as visible motion spans", () => {
    const props = {
      joinHref: "https://example.com/join",
      handleViewShowcase: vi.fn(),
    };

    const { rerender } = render(React.createElement(HeroSection, props));

    // Title words render as Framer Motion spans. The entrance animation is
    // driven by motion's initial/animate props (and disabled under reduced
    // motion), so we assert the words render rather than a CSS class.
    expect(screen.getByText("Build").tagName).toBe("SPAN");
    expect(screen.getByText("Products").tagName).toBe("SPAN");

    Object.assign(messages, {
      titleLine1: "Build Better",
      titleLine2: "Products Today",
    });
    translatorRef.current = (key: keyof typeof messages) => messages[key];

    rerender(React.createElement(HeroSection, props));

    // After the translated title changes, the new words are rendered.
    expect(screen.getByText("Today").tagName).toBe("SPAN");
  });

  it("links the announcement banner to the WhatsApp community", () => {
    render(
      React.createElement(HeroSection, {
        joinHref: "https://example.com/join",
        handleViewShowcase: vi.fn(),
      }),
    );

    expect(screen.getByText("Announcement").closest("a")).toHaveAttribute(
      "href",
      "https://wa.vibedevid.com",
    );
  });
});

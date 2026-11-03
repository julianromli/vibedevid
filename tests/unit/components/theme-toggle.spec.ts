import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// The server does not know the theme. If the SSR markup depended on it, the client
// (which does) would hit React hydration error #418.
describe("ThemeToggle SSR markup", () => {
  it("does not depend on the resolved theme", () => {
    const html = renderToString(createElement(ThemeToggle));
    expect(html).toContain('aria-label="Toggle theme"');
    expect(html).toContain("lucide-sun-dim");
    expect(html).toContain("lucide-moon");
  });
});

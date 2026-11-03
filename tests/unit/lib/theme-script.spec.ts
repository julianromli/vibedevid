import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ClientThemeProvider } from "@/components/client-theme-provider";
import { themeScript } from "@/lib/theme-script";

function run(stored: string | null, systemDark = false) {
  const html = document.documentElement;
  html.className = "font-sans antialiased";
  html.style.colorScheme = "";
  if (stored === null) localStorage.removeItem("theme");
  else localStorage.setItem("theme", stored);
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: systemDark && q.includes("dark") }));
  new Function(themeScript)();
  return `${html.className}|${html.style.colorScheme}`;
}

describe("themeScript", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("applies the stored theme, the system theme, or the dark default", () => {
    expect(run(null)).toBe("font-sans antialiased dark|dark");
    expect(run("light")).toBe("font-sans antialiased light|light");
    expect(run("dark")).toBe("font-sans antialiased dark|dark");
    expect(run("system", false)).toBe("font-sans antialiased light|light");
    expect(run("system", true)).toBe("font-sans antialiased dark|dark");
    expect(run("bogus")).toBe("font-sans antialiased dark|dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("is a plain string without bundler helpers", () => {
    expect(themeScript).not.toContain("__name");
  });

  it("next-themes' own body script is rendered inert", () => {
    const html = renderToString(createElement(ClientThemeProvider, null, "x"));
    expect(html).toMatch(/<script type="text\/plain"/);
  });
});

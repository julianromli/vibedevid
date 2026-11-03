"use client";

import { ThemeProvider } from "next-themes";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme-script";

interface ClientThemeProviderProps {
  children: React.ReactNode;
}

// next-themes always renders its own inline script inside <body>, which can run after
// the first paint. The blocking script in <head> (lib/theme-script.ts) does that job,
// so the next-themes script is made inert with a non-JavaScript type.
const inertScriptProps = { type: "text/plain" } as const;

export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      storageKey={THEME_STORAGE_KEY}
      enableSystem
      disableTransitionOnChange
      scriptProps={inertScriptProps}
    >
      {children}
    </ThemeProvider>
  );
}

"use client";

import { ThemeProvider } from "next-themes";

interface ClientThemeProviderProps {
  children: React.ReactNode;
}

export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

import "../styles.css";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import i18n, { i18nInit } from "@/i18n";
import { isVariantId, type PreviewMessage } from "./bridge";
import { PreviewApp } from "./preview-app";

const params = new URLSearchParams(window.location.search);
const variant = params.get("v");

/** Previews are pictures of a page: links never navigate, the router stays in memory. */
document.addEventListener(
  "click",
  (event) => {
    const anchor = (event.target as Element | null)?.closest("a");
    if (anchor) event.preventDefault();
  },
  true,
);

/** Hand wheel input back to the canvas unless the preview itself can scroll that way. */
window.addEventListener(
  "wheel",
  (event) => {
    if (window.parent === window) return;
    const root = document.scrollingElement ?? document.documentElement;
    const canScroll =
      !event.ctrlKey &&
      !event.metaKey &&
      ((event.deltaY < 0 && root.scrollTop > 0) ||
        (event.deltaY > 0 && root.scrollTop + root.clientHeight < root.scrollHeight - 1));
    if (canScroll) return;
    event.preventDefault();
    const message: PreviewMessage = {
      type: "vd-canvas-wheel",
      dx: event.deltaX,
      dy: event.deltaY,
      ctrl: event.ctrlKey || event.metaKey,
      shift: event.shiftKey,
      x: event.clientX,
      y: event.clientY,
    };
    window.parent.postMessage(message, window.location.origin);
  },
  { passive: false },
);

const rootRoute = createRootRoute({
  component: () => <PreviewApp variant={isVariantId(variant) ? variant : "wall"} />,
});
const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

void i18nInit.then(() => {
  const lang = params.get("lang");
  if (lang === "id" || lang === "en") void i18n.changeLanguage(lang);
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <ThemeProvider
        attribute="class"
        defaultTheme={params.get("theme") === "light" ? "light" : "dark"}
        enableSystem={false}
        storageKey="vibedevid.hero-canvas.preview-theme"
        disableTransitionOnChange
      >
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>,
  );
});

import { useHydrated, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/**
 * Thin bar at the top of the page while a client navigation loads.
 * Fast navigations finish before the 150ms animation delay and never show it.
 * Renders nothing until hydration: the server router still reports "pending",
 * so rendering it in SSR would flash the bar and mismatch on hydrate.
 */
export function NavigationProgress() {
  const { t } = useTranslation("common");
  const hydrated = useHydrated();
  const pending = useRouterState({ select: (state) => state.status === "pending" });
  const show = hydrated && pending;

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {show ? t("loadingPage") : ""}
      </span>
      {show && (
        <div
          role="progressbar"
          aria-label={t("loadingPage")}
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
        >
          <div className="bg-primary animate-nav-progress h-full origin-left" />
        </div>
      )}
    </>
  );
}

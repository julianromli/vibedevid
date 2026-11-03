import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/**
 * Thin bar at the top of the page while a client navigation loads.
 * Fast navigations finish before the 150ms animation delay and never show it.
 */
export function NavigationProgress() {
  const { t } = useTranslation("common");
  const pending = useRouterState({ select: (state) => state.status === "pending" });
  if (!pending) return null;

  return (
    <div
      role="progressbar"
      aria-label={t("loadingPage")}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
    >
      <div className="bg-primary animate-nav-progress h-full origin-left" />
    </div>
  );
}

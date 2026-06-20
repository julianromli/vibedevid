export const DASHBOARD_TAB_VALUES = [
  "overview",
  "analytics",
  "events-approval",
  "projects",
  "blog",
  "users",
  "admin-management",
  "comments",
] as const;

export type DashboardTabValue = (typeof DASHBOARD_TAB_VALUES)[number];

export const DEFAULT_DASHBOARD_TAB: DashboardTabValue = "overview";

export function isDashboardTabValue(value: string | null | undefined): value is DashboardTabValue {
  return value != null && (DASHBOARD_TAB_VALUES as readonly string[]).includes(value);
}

export function resolveDashboardTab(tab: string | null | undefined): DashboardTabValue {
  return isDashboardTabValue(tab) ? tab : DEFAULT_DASHBOARD_TAB;
}

/** Tab-only URL used when switching tabs (drops board filters/pagination). */
export function buildDashboardTabHref(pathname: string, tab: string): string {
  const resolved = resolveDashboardTab(tab);
  if (resolved === DEFAULT_DASHBOARD_TAB) {
    return pathname;
  }
  return `${pathname}?tab=${resolved}`;
}

/** Query string that keeps the current board tab after clearing filters. */
export function buildDashboardBoardClearHref(tab: DashboardTabValue): string {
  if (tab === DEFAULT_DASHBOARD_TAB) {
    return "?";
  }
  return `?tab=${tab}`;
}

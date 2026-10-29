"use client";

import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ViewCountDisplay({ views }: { views: number }) {
  const { t } = useTranslation("common");
  const count = Number.isFinite(views) ? views : 0;

  return (
    <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground tabular-nums">
      <Eye className="h-4 w-4" aria-hidden="true" />
      <span aria-hidden="true">{count.toLocaleString()}</span>
      <span className="sr-only">{t("viewCount", { count })}</span>
    </span>
  );
}

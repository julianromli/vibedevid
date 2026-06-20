"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/ui/motion-wrapper";

export function Footer() {
  const { t } = useTranslation("footer");

  return (
    <footer className="bg-muted/50 border-border relative border-t py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal
          margin="0px"
          className="flex flex-col items-center justify-between md:flex-row"
        >
          <div className="text-muted-foreground mb-4 text-sm md:mb-0">
            {t("copyright", { year: new Date().getFullYear() })}
          </div>
          <div className="flex space-x-6 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground">
              {t("privacy")}
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground">
              {t("terms")}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}

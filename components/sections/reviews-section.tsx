/**
 * Reviews Section Component
 * Displays testimonials from community members
 */

"use client";

import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ScaleIn, ScrollReveal } from "@/components/ui/motion-wrapper";
import {
  resolveLandingTestimonials,
  splitTestimonialsIntoColumns,
} from "@/lib/testimonials-landing";
import type { Testimonial } from "@/types/homepage";

const TestimonialsColumns = lazy(() =>
  import("@/components/ui/testimonials-columns").then((module) => ({
    default: module.TestimonialsColumns,
  })),
);

const SEED_IMAGES = [
  "https://github.com/shadcn.png",
  "/optimized/professional-woman-dark-hair-128.webp",
  "/optimized/blonde-woman-glasses-128.webp",
  "/optimized/asian-man-short-hair-128.webp",
  "https://github.com/shadcn.png",
  "https://github.com/shadcn.png",
];

function getSeedTestimonials(
  testimonialsRaw: Record<string, { text: string; name: string; role: string }>,
): Testimonial[] {
  return Object.values(testimonialsRaw).map((item, index) => ({
    text: item.text,
    image: SEED_IMAGES[index] ?? "/placeholder.svg",
    name: item.name,
    role: item.role,
  }));
}

export function ReviewsSection({
  approvedTestimonials = [],
}: {
  approvedTestimonials?: Testimonial[];
}) {
  const { t } = useTranslation("reviews");
  const testimonialsRaw = t("testimonials", { returnObjects: true }) as Record<
    string,
    { text: string; name: string; role: string }
  >;

  const testimonials = resolveLandingTestimonials(
    approvedTestimonials,
    getSeedTestimonials(testimonialsRaw),
  );
  const [columnOne, columnTwo, columnThree] = splitTestimonialsIntoColumns(testimonials, 3);

  return (
    <section id="reviews" className="bg-muted/20 py-20" data-animate>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">{t("title")}</h2>
          <p className="text-muted-foreground text-xl">{t("subtitle")}</p>
        </ScrollReveal>

        <ScaleIn className="flex max-h-[600px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <Suspense
            fallback={
              <div className="flex justify-center gap-6">
                <div className="flex flex-col space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-muted/20 w-80 animate-pulse rounded-lg p-4">
                      <div className="bg-muted/30 mb-3 h-20 rounded"></div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-muted/30 h-10 w-10 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-muted/30 h-4 w-3/4 rounded"></div>
                          <div className="bg-muted/20 h-3 w-1/2 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            {columnOne.length > 0 ? (
              <TestimonialsColumns testimonials={columnOne} duration={15} />
            ) : null}
            {columnTwo.length > 0 ? (
              <TestimonialsColumns
                testimonials={columnTwo}
                className="hidden md:block"
                duration={19}
              />
            ) : null}
            {columnThree.length > 0 ? (
              <TestimonialsColumns
                testimonials={columnThree}
                className="hidden lg:block"
                duration={17}
              />
            ) : null}
          </Suspense>
        </ScaleIn>
      </div>
    </section>
  );
}

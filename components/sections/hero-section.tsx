/**
 * Hero Section Component
 * Homepage hero with animated title, CTA buttons, Safari mockup, and framework tooltips
 */

"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Button } from "@/components/ui/button";
import { LogoMarquee } from "@/components/ui/logo-marquee";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { SafariMockup } from "@/components/ui/safari-mockup";
import { cn } from "@/lib/utils";
import type { User } from "@/types/homepage";

interface HeroSectionProps {
  isLoggedIn: boolean;
  user?: User;
  handleJoinWithUs: () => void;
  handleViewShowcase: () => void;
}

export function HeroSection({
  isLoggedIn,
  user,
  handleJoinWithUs,
  handleViewShowcase,
}: HeroSectionProps) {
  const [animatedWords, setAnimatedWords] = useState<number[]>([]);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const t = useTranslations("hero");

  // Get translated title words
  const titleLine1 = t.raw("titleLine1") as string[];
  const titleLine2 = t.raw("titleLine2") as string[];

  // Animated title effect
  useEffect(() => {
    const words = [...titleLine1, ...titleLine2];

    words.forEach((word, index) => {
      setTimeout(() => {
        setAnimatedWords((prev) => [...prev, index]);
      }, index * 100);
    });

    setTimeout(
      () => {
        setSubtitleVisible(true);
      },
      words.length * 100 + 200,
    );
  }, [titleLine1, titleLine2]);

  return (
    <section className="bg-grid-pattern relative mt-0 py-20 lg:py-32">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="space-y-8 text-center">
            <Link
              href="/blog"
              className="inline-block cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              <AnimatedGradientText className="transition-all duration-300 hover:shadow-[inset_0_-5px_10px_#8fdfff4f]">
                <span
                  className={cn(
                    `animate-gradient inline bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`,
                  )}
                >
                  {t("announcement")}
                </span>
                <span className="ml-2 font-semibold text-orange-500">
                  {t("readLatest")}
                </span>
              </AnimatedGradientText>
            </Link>

            <h1 className="text-foreground text-6xl md:text-7xl lg:text-8xl leading-10 leading-tight font-bold tracking-tight">
              {titleLine1.map((word, index) => (
                <span
                  key={index}
                  className={`mr-3 inline-block leading-3 transition-all duration-700 ease-out ${
                    animatedWords.includes(index)
                      ? "blur-0 translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0 blur-sm"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {word}
                </span>
              ))}
              <br />
              {titleLine2.map((word, index) => (
                <span
                  key={index + titleLine1.length}
                  className={`mr-3 inline-block leading-3 transition-all duration-700 ease-out ${
                    animatedWords.includes(index + titleLine1.length)
                      ? "blur-0 translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0 blur-sm"
                  }`}
                  style={{
                    transitionDelay: `${(index + titleLine1.length) * 100}ms`,
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>

            <p
              className={`text-muted-foreground mx-auto max-w-lg text-center text-xl leading-relaxed transition-all duration-700 ease-out ${
                subtitleVisible
                  ? "blur-0 translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0 blur-sm"
              }`}
            >
              {t("subtitle")}
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleJoinWithUs}
              >
                <ArrowRight className="h-4 w-4" />
                {t("joinCommunity")}
              </Button>
              <Button size="lg" variant="outline" onClick={handleViewShowcase}>
                {t("ourShowcase")}
              </Button>
            </div>
          </div>

          <div className="relative">
            <SafariMockup url="vibedevid.com">
              <ProgressiveImage
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SOLO-pic-EN.35a702ba-uLVDZsjReIz7K4Ecr3JBrYkLCl8cdm.png"
                alt="Development environment showing SOLO Builder interface with movie website project documentation"
                width={1200}
                height={675}
                className="h-auto w-full object-cover"
                priority={true}
                enableBlurPlaceholder={true}
                quality={75}
                responsiveSizes={{
                  mobile: "100vw",
                  tablet: "100vw",
                  desktop: "1200px",
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              />
            </SafariMockup>
          </div>

          <div className="relative mt-12 mb-8">
            <div className="my-0 flex items-center justify-center opacity-90">
              <Suspense
                fallback={
                  <div className="bg-muted/20 h-12 w-full animate-pulse rounded-lg" />
                }
              >
                <LogoMarquee />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden">
            {/* Framework logos moved above Safari mockup */}
          </div>
        </div>
      </div>
    </section>
  );
}

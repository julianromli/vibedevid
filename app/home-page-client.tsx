"use client";

import { lazy, Suspense } from "react";
import { HeroSection } from "@/components/sections/hero-section";
import { HomeStructuredData } from "@/components/sections/home-structured-data";
import { ProjectShowcase } from "@/components/sections/project-showcase";
import { ProjectShowcaseProvider } from "@/components/sections/project-showcase/project-showcase-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Navbar } from "@/components/ui/navbar";
import type { Project, ProjectFilterOption, SortBy, User, VibeVideo } from "@/types/homepage";

// Below-the-fold sections are code-split so their JS does not block initial
// hydration/interactivity. This is the main lever for reducing Total Blocking
// Time on the homepage (Lighthouse `bootup-time` / `mainthread-work-breakdown`).
const YouTubeVideoShowcase = lazy(() =>
  import("@/components/ui/youtube-video-showcase").then((m) => ({
    default: m.YouTubeVideoShowcase,
  })),
);
const CommunityFeaturesSection = lazy(() =>
  import("@/components/sections/community-features-section").then((m) => ({
    default: m.CommunityFeaturesSection,
  })),
);
const AIToolsSection = lazy(() =>
  import("@/components/sections/ai-tools-section").then((m) => ({
    default: m.AIToolsSection,
  })),
);
const ReviewsSection = lazy(() =>
  import("@/components/sections/reviews-section").then((m) => ({
    default: m.ReviewsSection,
  })),
);
const FAQSection = lazy(() =>
  import("@/components/sections/faq-section").then((m) => ({ default: m.FAQSection })),
);
const CTASection = lazy(() =>
  import("@/components/sections/cta-section").then((m) => ({ default: m.CTASection })),
);
const Footer = lazy(() => import("@/components/ui/footer").then((m) => ({ default: m.Footer })));

const SectionFallback = (
  <div className="mx-auto my-12 h-48 w-full max-w-7xl animate-pulse rounded-lg bg-muted/20" />
);

const JOIN_HREF = "https://dub.sh/vibedevid-form";

interface HomePageClientProps {
  initialIsLoggedIn: boolean;
  initialUser: User | null;
  initialProjects: Project[];
  initialCategories: ProjectFilterOption[];
  initialFilter: string;
  initialSort: SortBy;
  initialVibeVideos: VibeVideo[];
}

function scrollToShowcase() {
  document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomePageClient({
  initialIsLoggedIn,
  initialUser,
  initialProjects,
  initialCategories,
  initialFilter,
  initialSort,
  initialVibeVideos,
}: HomePageClientProps) {
  return (
    <main id="main-content" className="bg-background min-h-screen">
      <HomeStructuredData />

      <Navbar
        showNavigation={true}
        isLoggedIn={initialIsLoggedIn}
        user={initialUser ?? undefined}
      />

      <HeroSection joinHref={JOIN_HREF} handleViewShowcase={scrollToShowcase} />

      <ErrorBoundary sectionName="Project Showcase">
        <ProjectShowcaseProvider
          initialProjects={initialProjects}
          initialCategories={initialCategories}
          initialFilter={initialFilter}
          initialSort={initialSort}
        >
          <ProjectShowcase />
        </ProjectShowcaseProvider>
      </ErrorBoundary>

      <ErrorBoundary sectionName="Video Showcase">
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
            <Suspense fallback={SectionFallback}>
              <YouTubeVideoShowcase vibeVideos={initialVibeVideos} />
            </Suspense>
          </div>
        </section>
      </ErrorBoundary>

      <Suspense fallback={SectionFallback}>
        <CommunityFeaturesSection />
      </Suspense>

      <Suspense fallback={SectionFallback}>
        <AIToolsSection />
      </Suspense>

      <Suspense fallback={SectionFallback}>
        <ReviewsSection />
      </Suspense>

      <Suspense fallback={SectionFallback}>
        <FAQSection />
      </Suspense>

      <Suspense fallback={SectionFallback}>
        <CTASection joinHref={JOIN_HREF} />
      </Suspense>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </main>
  );
}

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HeroSection } from "@/components/sections/hero-section";
import {
  HeroEditorial,
  HeroGoldGlow,
  HeroMemberRow,
  HeroMinimal,
  HeroOrbit,
  HeroPrompt,
  HeroRefined,
  HeroShowcaseWall,
  HeroTerminal,
  type HeroVariantProps,
} from "@/components/sections/hero-variants";
import { Navbar } from "@/components/ui/navbar";
import i18n from "@/i18n";
import { JOIN_COMMUNITY_URL } from "@/lib/seo/site-url";
import { SHOWCASE_PROJECTS } from "../fixtures/projects";
import type { HostMessage, PreviewMessage, VariantId } from "./bridge";

const VARIANTS: Record<
  Exclude<VariantId, "current">,
  (props: HeroVariantProps) => React.ReactNode
> = {
  refined: HeroRefined,
  "member-row": HeroMemberRow,
  "gold-glow": HeroGoldGlow,
  minimal: HeroMinimal,
  wall: HeroShowcaseWall,
  prompt: HeroPrompt,
  terminal: HeroTerminal,
  editorial: HeroEditorial,
  orbit: HeroOrbit,
};

const noop = () => {};

export function PreviewApp({ variant }: { variant: VariantId }) {
  const { setTheme } = useTheme();
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const onMessage = (event: MessageEvent<HostMessage>) => {
      if (event.origin !== window.location.origin || event.data?.type !== "vd-preview-settings")
        return;
      const { settings } = event.data;
      setTheme(settings.theme);
      if (i18n.language !== settings.lang) void i18n.changeLanguage(settings.lang);
      setReplay(settings.replay);
    };
    window.addEventListener("message", onMessage);
    if (window.parent !== window) {
      const ready: PreviewMessage = { type: "vd-preview-ready" };
      window.parent.postMessage(ready, window.location.origin);
    }
    return () => window.removeEventListener("message", onMessage);
  }, [setTheme]);

  const Variant = variant === "current" ? null : VARIANTS[variant];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar showNavigation isLoggedIn={false} />
      {Variant ? (
        <Variant
          key={replay}
          projects={SHOWCASE_PROJECTS}
          joinHref={JOIN_COMMUNITY_URL}
          onViewShowcase={noop}
          forceIntro={replay > 0}
        />
      ) : (
        <HeroSection key={replay} joinHref={JOIN_COMMUNITY_URL} handleViewShowcase={noop} />
      )}
    </div>
  );
}

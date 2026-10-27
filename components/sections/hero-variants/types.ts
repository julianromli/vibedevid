/**
 * Data shapes for the hero explorations. These are a subset of the public
 * `Project` fields the showcase already returns, minus author data, so a
 * promoted variant can be fed straight from the existing projects query.
 */
export interface HeroProject {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string;
  likes: number;
  views: number;
}

export interface HeroVariantProps {
  /** Most recent public projects, newest first. */
  projects: HeroProject[];
  joinHref: string;
  onViewShowcase: () => void;
  /** Skips the once-per-session intro guard. Used by the design canvas. */
  forceIntro?: boolean;
}

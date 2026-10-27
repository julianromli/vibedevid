/** Messages between the canvas host and a preview iframe. Same origin only. */
export type PreviewTheme = "dark" | "light";
export type PreviewLang = "id" | "en";

export interface PreviewSettings {
  theme: PreviewTheme;
  lang: PreviewLang;
  /** Bumped by the toolbar's replay button. */
  replay: number;
}

export type HostMessage = { type: "vd-preview-settings"; settings: PreviewSettings };

export type PreviewMessage =
  | { type: "vd-preview-ready" }
  | {
      type: "vd-canvas-wheel";
      dx: number;
      dy: number;
      ctrl: boolean;
      shift: boolean;
      x: number;
      y: number;
    };

export const VARIANT_IDS = [
  "current",
  "refined",
  "member-row",
  "gold-glow",
  "minimal",
  "wall",
  "prompt",
  "terminal",
  "editorial",
  "orbit",
] as const;
export type VariantId = (typeof VARIANT_IDS)[number];

export function isVariantId(value: string | null): value is VariantId {
  return value !== null && (VARIANT_IDS as readonly string[]).includes(value);
}

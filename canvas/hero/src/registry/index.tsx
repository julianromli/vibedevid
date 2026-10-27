import { PreviewFrame } from "../PreviewFrame";
import type { VariantId } from "../preview/bridge";
import { ReferenceCard } from "../ReferenceCard";
import { REFERENCES, type Reference } from "../references";
import type { CanvasEntry, CanvasGroup, CanvasSection } from "./types";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

interface VariantMeta {
  id: VariantId;
  letter: string;
  name: string;
  idea: string;
  source: string;
}

export const VARIANTS: VariantMeta[] = [
  {
    id: "wall",
    letter: "A",
    name: "Etalase",
    idea: "Headline di kiri, dinding proyek showcase asli yang gerak ikut kursor di kanan. Bukti langsung, tanpa mockup.",
    source: "components/sections/hero-variants/hero-showcase-wall.tsx",
  },
  {
    id: "prompt",
    letter: "B",
    name: "Prompt ke proyek",
    idea: "Kotak prompt sebagai hero. Klik contoh, keluar proyek member yang beneran pernah bikin hal itu.",
    source: "components/sections/hero-variants/hero-prompt.tsx",
  },
  {
    id: "terminal",
    letter: "C",
    name: "Terminal",
    idea: "Sesi vibe coding diputar di terminal: rencana, build, rilis, lalu nyambung ke proyek aslinya.",
    source: "components/sections/hero-variants/hero-terminal.tsx",
  },
  {
    id: "editorial",
    letter: "D",
    name: "Editorial",
    idea: "Headline serif besar, wordmark samar di belakang, panel grain emas berisi angka komunitas yang jujur.",
    source: "components/sections/hero-variants/hero-editorial.tsx",
  },
  {
    id: "orbit",
    letter: "E",
    name: "Orbit",
    idea: "Logo V di tengah, proyek member mengorbit di dua cincin yang berputar pelan ikut kursor.",
    source: "components/sections/hero-variants/hero-orbit.tsx",
  },
];

function frames(id: VariantId, label: string, source: string): CanvasEntry[] {
  return [
    {
      id: `${id}.desktop`,
      name: `${label} · Desktop 1440`,
      source,
      ...DESKTOP,
      Preview: () => <PreviewFrame variant={id} title={`${label}, desktop`} {...DESKTOP} />,
    },
    {
      id: `${id}.mobile`,
      name: `${label} · Mobile 390`,
      source,
      ...MOBILE,
      Preview: () => <PreviewFrame variant={id} title={`${label}, mobile`} {...MOBILE} />,
    },
  ];
}

function referenceEntry(reference: Reference): CanvasEntry {
  return {
    id: `ref.${reference.id}`,
    name: `${reference.app} · ${reference.id}`,
    source: reference.mobbinUrl.replace("https://", ""),
    width: 560,
    height: 560,
    Preview: () => <ReferenceCard reference={reference} />,
  };
}

const refs = (...ids: string[]) =>
  ids.map((id) => {
    const reference = REFERENCES.find((candidate) => candidate.id === id);
    if (!reference) throw new Error(`Unknown reference ${id}`);
    return referenceEntry(reference);
  });

const REFERENCE_GROUPS: CanvasGroup[] = [
  {
    id: "prompt",
    title: "Prompt sebagai hero · B",
    entries: refs("lovable-prompt", "replit", "zaro"),
  },
  { id: "proof", title: "Karya nyata · A", entries: refs("taste-labs", "lovable-community") },
  { id: "editorial", title: "Editorial · D", entries: refs("intercom", "grok", "dropbox") },
  { id: "terminal", title: "Proses · C", entries: refs("content-architecture") },
  { id: "orbit", title: "Komunitas · E", entries: refs("framer") },
];

export const SECTIONS: CanvasSection[] = [
  {
    id: "current",
    title: "Hero sekarang",
    description:
      "components/sections/hero-section.tsx seperti di vibedeveloper.id hari ini. Pembanding.",
    groups: [
      {
        id: "current",
        title: "Saat ini",
        direction: "row",
        entries: frames("current", "Hero sekarang", "components/sections/hero-section.tsx"),
      },
    ],
  },
  {
    id: "variants",
    title: "Varian hero",
    description:
      "Lima arah, semuanya komponen React asli dengan token, font dan i18n situs. Data proyek diambil dari showcase publik 27 Okt 2026. Pakai toolbar buat ganti tema, bahasa, atau putar ulang intro.",
    groups: VARIANTS.map((variant) => ({
      id: variant.id,
      title: `${variant.letter} · ${variant.name}`,
      description: variant.idea,
      direction: "row" as const,
      entries: frames(variant.id, `${variant.letter} ${variant.name}`, variant.source),
    })),
  },
  {
    id: "references",
    title: "Referensi Mobbin",
    description:
      "Hero dari produk lain yang jadi bahan. Gambar milik masing-masing app, diambil lewat Mobbin.",
    groups: REFERENCE_GROUPS,
  },
];

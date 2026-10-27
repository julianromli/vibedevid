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

export const ROUND2_VARIANTS: VariantMeta[] = [
  {
    id: "refined",
    letter: "F",
    name: "Rapi",
    idea: "Hero sekarang, cuma dirapikan: judul lebih rapat, subjudul lebih sempit, tombol utama jelas, badge diam, jarak lebih lega. Mockup dan logo tetap.",
    source: "components/sections/hero-variants/hero-refined.tsx",
  },
  {
    id: "member-row",
    letter: "G",
    name: "Karya member",
    idea: "Teks dan tombol sama, mockup diganti satu baris diam berisi lima proyek member terbaru (empat di mobile).",
    source: "components/sections/hero-variants/hero-member-row.tsx",
  },
  {
    id: "gold-glow",
    letter: "H",
    name: "Cahaya emas",
    idea: "Hero sekarang di atas cahaya emas lembut berbutir yang diam, menggantikan grid titik. Tidak ada tambahan lain.",
    source: "components/sections/hero-variants/hero-gold-glow.tsx",
  },
  {
    id: "minimal",
    letter: "I",
    name: "Minimal",
    idea: "Judul, subjudul dan satu tombol di tengah ruang kosong. Di bawahnya satu baris pelan: jumlah member dan link showcase.",
    source: "components/sections/hero-variants/hero-minimal.tsx",
  },
];

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

const ROUND2_REFERENCE_GROUPS: CanvasGroup[] = [
  {
    id: "calm",
    title: "Hero tenang · F, G, H, I",
    direction: "row",
    entries: refs("onepassword", "bento", "webflow-community", "retool"),
  },
];

const ROUND1_REFERENCE_GROUPS: CanvasGroup[] = [
  {
    id: "prompt",
    title: "Prompt sebagai hero · B",
    entries: refs("lovable-prompt", "replit", "zaro"),
  },
  { id: "proof", title: "Karya nyata · A", entries: refs("taste-labs", "lovable-community") },
  { id: "editorial", title: "Editorial · D", entries: refs("intercom", "grok", "dropbox") },
  { id: "terminal", title: "Proses · C", entries: refs("content-architecture") },
  { id: "orbit", title: "Komunitas · E", entries: refs("framer") },
].map((group) => ({ ...group, id: `r1-${group.id}`, title: `Referensi ${group.title}` }));

const variantGroup = (variant: VariantMeta): CanvasGroup => ({
  id: variant.id,
  title: `${variant.letter} · ${variant.name}`,
  description: variant.idea,
  direction: "row",
  entries: frames(variant.id, `${variant.letter} ${variant.name}`, variant.source),
});

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
    id: "round2",
    title: "Ronde 2",
    description:
      "Empat evolusi dari hero sekarang. Judul, subjudul, tombol, token dan font sama. Elemen lebih sedikit, gerak cuma fade pendek sekali per sesi, mati total kalau reduced motion.",
    groups: ROUND2_VARIANTS.map(variantGroup),
  },
  {
    id: "references",
    title: "Referensi Mobbin",
    description:
      "Hero tenang dari produk lain yang jadi bahan ronde 2. Gambar milik masing-masing app, diambil lewat Mobbin.",
    groups: ROUND2_REFERENCE_GROUPS,
  },
  {
    id: "round1",
    title: "Ronde 1 (ditolak)",
    description:
      "Lima arah pertama. Ditolak: terlalu ramai, terlalu jauh dari gaya situs, geraknya nggak cocok. Disimpan buat catatan.",
    groups: [...VARIANTS.map(variantGroup), ...ROUND1_REFERENCE_GROUPS],
  },
];

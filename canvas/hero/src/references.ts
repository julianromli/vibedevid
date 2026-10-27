import contentArchitecture from "../assets/refs/content-architecture.webp";
import dropbox from "../assets/refs/dropbox.webp";
import framer from "../assets/refs/framer.webp";
import grok from "../assets/refs/grok.webp";
import intercom from "../assets/refs/intercom.webp";
import lovableCommunity from "../assets/refs/lovable-community.webp";
import lovablePrompt from "../assets/refs/lovable-prompt.webp";
import replit from "../assets/refs/replit.webp";
import tasteLabs from "../assets/refs/taste-labs.webp";
import zaro from "../assets/refs/zaro.webp";

export interface Reference {
  id: string;
  app: string;
  image: string;
  mobbinUrl: string;
  takeaway: string;
  /** Variants that borrow from this reference. */
  usedBy: string[];
}

const mobbin = (id: string) => `https://mobbin.com/sites/sections/${id}`;

/** Screenshots via Mobbin. Each image belongs to the app named on its card. */
export const REFERENCES: Reference[] = [
  {
    id: "lovable-prompt",
    app: "Lovable",
    image: lovablePrompt,
    mobbinUrl: mobbin("8a18799b-adf6-4da7-9a7e-4aa4597a51f0"),
    takeaway: 'Prompt box jadi hero, langsung nyambung ke grid "From the Community".',
    usedBy: ["B"],
  },
  {
    id: "lovable-community",
    app: "Lovable",
    image: lovableCommunity,
    mobbinUrl: mobbin("bf12496d-52c5-487f-997e-eb9f6b9bdeab"),
    takeaway: "Kartu proyek komunitas pake angka asli (remix), bukan testimoni.",
    usedBy: ["A", "B"],
  },
  {
    id: "replit",
    app: "Replit",
    image: replit,
    mobbinUrl: mobbin("bf8f414f-e9a8-46db-abe6-97622ff6a78a"),
    takeaway: "Chip contoh prompt di bawah input bikin orang langsung nyoba.",
    usedBy: ["B"],
  },
  {
    id: "zaro",
    app: "Zaro",
    image: zaro,
    mobbinUrl: mobbin("1504b865-76c3-4681-8079-da52475e6e58"),
    takeaway: "Contoh prompt yang bisa diganti-ganti, hasilnya kerasa personal.",
    usedBy: ["B"],
  },
  {
    id: "taste-labs",
    app: "Taste Labs",
    image: tasteLabs,
    mobbinUrl: mobbin("0e642ae4-ed2b-403d-a33c-42c0d9fcbeb8"),
    takeaway: "Statement pendek di kiri, hasil karya nyata yang ngomong di kanan.",
    usedBy: ["A"],
  },
  {
    id: "intercom",
    app: "Intercom",
    image: intercom,
    mobbinUrl: mobbin("39187258-6102-4f67-9875-f6ff00bc6a21"),
    takeaway: "Headline serif gede di atas grid cerita nyata yang diredupin.",
    usedBy: ["D"],
  },
  {
    id: "framer",
    app: "Framer",
    image: framer,
    mobbinUrl: mobbin("04731a30-7ae1-4b57-80d8-1fb3a0bdce15"),
    takeaway: "Komunitas digambar sebagai orbit di sekitar satu logo.",
    usedBy: ["E"],
  },
  {
    id: "dropbox",
    app: "Dropbox",
    image: dropbox,
    mobbinUrl: mobbin("8ce2acac-8784-4961-8b66-49e64543001c"),
    takeaway: "Angka komunitas ditulis polos dan jujur, tanpa hiasan.",
    usedBy: ["D"],
  },
  {
    id: "content-architecture",
    app: "The Content Architecture",
    image: contentArchitecture,
    mobbinUrl: mobbin("29bfe158-19c6-48e3-b87a-f4e5e03b0e6f"),
    takeaway: "Editor/terminal sebagai bukti: tunjukin prosesnya, bukan mockup kosong.",
    usedBy: ["C"],
  },
  {
    id: "grok",
    app: "Grok",
    image: grok,
    mobbinUrl: mobbin("6d1d2671-6a8f-4bd9-868d-0f03dab5e519"),
    takeaway: "Wordmark raksasa samar di belakang, fokus tetap ke satu aksi.",
    usedBy: ["D"],
  },
];

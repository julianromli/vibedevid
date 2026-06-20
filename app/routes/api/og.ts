import { createFileRoute } from "@tanstack/react-router";

/**
 * Dynamic Open Graph image endpoint.
 *
 * Returns a branded 1200x630 SVG generated from the `title` (and optional
 * `subtitle`) query params. SVG keeps this dependency-free and safe to run on
 * Cloudflare Workers (no Satori/WASM bundle). Consumers reference it as
 * `/api/og?title=...`.
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Naive word-wrap into at most `maxLines` lines of ~`maxChars` characters. */
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);

  // Ellipsize if the title overflowed the allowed line budget.
  const consumed = lines.join(" ").length;
  if (consumed < text.length && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\s+\S*$/, "")}…`;
  }

  return lines;
}

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);
        const rawTitle = searchParams.get("title");

        if (!rawTitle) {
          return new Response("Missing title", { status: 400 });
        }

        const title = rawTitle.slice(0, 140);
        const subtitle = (searchParams.get("subtitle") || "VibeDev ID").slice(0, 80);

        const titleLines = wrapText(title, 28, 3);
        const titleSvg = titleLines
          .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 84}">${escapeXml(line)}</tspan>`)
          .join("");

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#171717"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="10" fill="#7c3aed"/>
  <text x="80" y="120" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="32" font-weight="600" fill="#a78bfa" letter-spacing="2">VIBEDEV ID</text>
  <text y="280" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="68" font-weight="800" fill="#ffffff">${titleSvg}</text>
  <text x="80" y="560" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="30" font-weight="500" fill="#a3a3a3">${escapeXml(subtitle)}</text>
</svg>`;

        return new Response(svg, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
          },
        });
      },
    },
  },
});

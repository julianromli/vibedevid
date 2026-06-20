import { createFileRoute } from "@tanstack/react-router";

type GitHubRepo = {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  html_url: string;
  owner?: {
    login?: string | null;
  } | null;
};

function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  if (!input) return null;
  let s = input.trim();
  if (s.startsWith("git@github.com:")) {
    s = s.replace("git@github.com:", "");
  }
  try {
    if (s.startsWith("http")) {
      const u = new URL(s);
      if (!u.hostname.endsWith("github.com")) return null;
      const parts = u.pathname
        .replace(/^\/+|\.git$/g, "")
        .split("/")
        .filter(Boolean);
      if (parts.length < 2) return null;
      return { owner: parts[0], repo: parts[1] };
    }
  } catch {
    // fallthrough to owner/repo parse
  }
  const parts = s
    .replace(/^\/+|\.git$/g, "")
    .split("/")
    .filter(Boolean);
  if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
  return null;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildOgImage(owner: string, repo: string): string {
  return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
}

function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname;
  } catch {
    return null;
  }
}

async function fetchReadmeSummary(
  owner: string,
  repo: string,
  headers: Record<string, string>,
): Promise<{
  description?: string;
  tagline?: string;
}> {
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        ...headers,
        Accept: "application/vnd.github.v3.raw",
      },
    });
    if (!readmeRes.ok) return {};
    const md = await readmeRes.text();

    let txt = md.replace(/```[\s\S]*?```/g, " ");
    txt = txt.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
    txt = txt.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
    txt = txt.replace(/<[^>]+>/g, " ");
    const lines = txt
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*#+\s*/, "").trim())
      .filter((l) => l && !/shields\.io|badge|ci|build status/i.test(l));
    const paragraphs = lines
      .join("\n")
      .split(/\n\s*\n+/)
      .map((p) => p.trim());

    let best = "";
    for (const p of paragraphs) {
      const plain = p.replace(/\s+/g, " ").trim();
      if (plain.length < 60) continue;
      if (/^license\b|^changelog\b|^installation\b/i.test(plain)) continue;
      best = plain;
      break;
    }
    if (!best) return {};

    const description = best.slice(0, 1600);
    const sentenceEnd =
      description.indexOf(".") !== -1
        ? description.indexOf(".") + 1
        : Math.min(100, description.length);
    const tagline = description.slice(0, sentenceEnd).trim();
    return { description, tagline };
  } catch {
    return {};
  }
}

export const Route = createFileRoute("/api/github-import")({
  server: {
    handlers: {
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: One route handles fetch + normalization for a single import contract.
      POST: async ({ request }) => {
        try {
          const { repoUrl } = await request.json();
          const parsed = parseRepoUrl(String(repoUrl || ""));
          if (!parsed) {
            return Response.json({ error: "Invalid GitHub repository URL" }, { status: 400 });
          }

          const { owner, repo } = parsed;
          const headers: Record<string, string> = {
            Accept: "application/vnd.github+json",
          };
          const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
          if (token) headers.Authorization = `Bearer ${token}`;

          const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
          if (!repoRes.ok) {
            const msg =
              repoRes.status === 404 ? "Repository not found" : "Failed to fetch repository";
            return Response.json({ error: msg }, { status: repoRes.status });
          }
          const repoData = (await repoRes.json()) as GitHubRepo;

          const topicsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/topics`, {
            headers: { ...headers, Accept: "application/vnd.github+json" },
          });
          const topicsJson = topicsRes.ok ? await topicsRes.json() : { names: [] as string[] };
          const topics: string[] = Array.isArray(topicsJson.names) ? topicsJson.names : [];

          const langsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
            headers,
          });
          const langsJson = langsRes.ok ? await langsRes.json() : ({} as Record<string, number>);
          const languages = Object.keys(langsJson || {});

          const title = normalizeText(repoData.name).replace(/[-_]+/g, " ") || repo;
          const readmeSummary = await fetchReadmeSummary(owner, repo, headers);
          const repoDescription = normalizeText(repoData.description);
          const description = (
            normalizeText(readmeSummary.description) ||
            repoDescription ||
            title
          ).slice(0, 1600);
          const tagline = (normalizeText(readmeSummary.tagline) || repoDescription || title).slice(
            0,
            120,
          );
          const website_url = normalizeText(repoData.homepage);
          const preview_image_url = buildOgImage(owner, repo);
          const image_url = preview_image_url;
          const domain = getDomainFromUrl(website_url) || "github.com";
          const favicon_url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

          const tagSet = new Set<string>();
          for (const t of topics) if (t) tagSet.add(String(t).toLowerCase());
          for (const l of languages) if (l) tagSet.add(String(l).toLowerCase());
          const normalized = Array.from(
            new Set(
              Array.from(tagSet)
                .map((t) => {
                  if (t === "js") return "javascript";
                  if (t === "ts") return "typescript";
                  if (t === "node") return "nodejs";
                  if (t === "next") return "next.js";
                  return t;
                })
                .filter(Boolean),
            ),
          );

          const repoMetadata = {
            name: normalizeText(repoData.name) || repo,
            full_name: normalizeText(repoData.full_name) || `${owner}/${repo}`,
            html_url: normalizeText(repoData.html_url) || `https://github.com/${owner}/${repo}`,
            owner: normalizeText(repoData.owner?.login) || owner,
          };

          return Response.json({
            title,
            tagline,
            description,
            website_url,
            preview_image_url,
            image_url,
            favicon_url,
            tags: normalized,
            repo: repoMetadata,
          });
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }
      },
    },
  },
});

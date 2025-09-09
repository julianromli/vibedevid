import { NextResponse } from "next/server";

type GitHubRepo = {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  html_url: string;
};

function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  if (!input) return null;
  let s = input.trim();
  // Support formats: owner/repo, https://github.com/owner/repo, git@github.com:owner/repo.git
  if (s.startsWith("git@github.com:")) {
    s = s.replace("git@github.com:", "");
  }
  try {
    if (s.startsWith("http")) {
      const u = new URL(s);
      if (!u.hostname.endsWith("github.com")) return null;
      const parts = u.pathname.replace(/^\/+|\.git$/g, "").split("/").filter(Boolean);
      if (parts.length < 2) return null;
      return { owner: parts[0], repo: parts[1] };
    }
  } catch {
    // fallthrough to owner/repo parse
  }
  const parts = s.replace(/^\/+|\.git$/g, "").split("/").filter(Boolean);
  if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
  return null;
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = obj[k];
  return out;
}

function buildOgImage(owner: string, repo: string): string {
  // Public Open Graph image endpoint (seed value can be any string)
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

export async function POST(req: Request) {
  try {
    const { repoUrl } = await req.json();
    const parsed = parseRepoUrl(String(repoUrl || ""));
    if (!parsed) {
      return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 });
    }

    const { owner, repo } = parsed;
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' };
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      const msg = repoRes.status === 404 ? 'Repository not found' : 'Failed to fetch repository';
      return NextResponse.json({ error: msg }, { status: repoRes.status });
    }
    const repoData = await repoRes.json() as GitHubRepo;

    const topicsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/topics`, { headers: { ...headers, 'Accept': 'application/vnd.github+json' } });
    const topicsJson = topicsRes.ok ? await topicsRes.json() : { names: [] as string[] };
    const topics: string[] = Array.isArray(topicsJson.names) ? topicsJson.names : [];

    const langsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
    const langsJson = langsRes.ok ? await langsRes.json() : {} as Record<string, number>;
    const languages = Object.keys(langsJson || {});

    // Try to fetch README (raw markdown) to generate a better description
    async function fetchReadmeSummary(): Promise<{ description?: string; tagline?: string }> {
      try {
        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
          headers: {
            ...headers,
            // Ask for raw content
            'Accept': 'application/vnd.github.v3.raw',
          },
        });
        if (!readmeRes.ok) return {};
        const md = await readmeRes.text();

        // Remove code blocks
        let txt = md.replace(/```[\s\S]*?```/g, " ");
        // Remove images
        txt = txt.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
        // Convert links [text](url) -> text
        txt = txt.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
        // Strip HTML tags
        txt = txt.replace(/<[^>]+>/g, " ");
        // Strip headings markup and badges lines
        const lines = txt
          .split(/\r?\n/)
          .map(l => l.replace(/^\s*#+\s*/, "").trim())
          .filter(l => l && !/shields\.io|badge|ci|build status/i.test(l));
        const paragraphs = lines.join("\n").split(/\n\s*\n+/).map(p => p.trim());

        let best = "";
        for (const p of paragraphs) {
          const plain = p.replace(/\s+/g, " ").trim();
          if (plain.length < 60) continue;
          if (/^license\b|^changelog\b|^installation\b/i.test(plain)) continue;
          best = plain;
          break;
        }
        if (!best) return {};

        // Build description and tagline from the first meaningful paragraph
        const description = best.slice(0, 1600);
        const sentenceEnd = description.indexOf('.') !== -1 ? description.indexOf('.') + 1 : Math.min(100, description.length);
        const tagline = description.slice(0, sentenceEnd).trim();
        return { description, tagline };
      } catch {
        return {};
      }
    }

    const title = repoData.name?.replace(/[-_]+/g, ' ') || repo;
    const readmeSummary = await fetchReadmeSummary();
    const description = (readmeSummary.description || repoData.description || "").toString().slice(0, 1600);
    const website_url = repoData.homepage && repoData.homepage.trim() !== '' ? repoData.homepage : '';
    const image_url = buildOgImage(owner, repo);
    const domain = getDomainFromUrl(website_url) || 'github.com';
    const favicon_url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

    // Normalize tags from topics + languages
    const tagSet = new Set<string>();
    for (const t of topics) if (t) tagSet.add(String(t).toLowerCase());
    for (const l of languages) if (l) tagSet.add(String(l).toLowerCase());
    // Common mappings
    const normalized = Array.from(tagSet).map(t => {
      if (t === 'js') return 'javascript';
      if (t === 'ts') return 'typescript';
      if (t === 'node') return 'nodejs';
      if (t === 'next') return 'next.js';
      return t;
    });

    const tagline = (readmeSummary.tagline || (description ? description.split(/\.|\n/)[0]?.slice(0, 100) : '')).trim();

    return NextResponse.json({
      title,
      tagline,
      description,
      website_url,
      image_url,
      favicon_url,
      tags: normalized,
      repo: pick(repoData, ['full_name', 'html_url'])
    });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

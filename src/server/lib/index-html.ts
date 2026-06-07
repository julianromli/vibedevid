import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { injectPageMetaIntoHtml } from '@/lib/seo/render-meta'
import type { PageMeta } from '@/lib/seo/types'

let cachedTemplate: string | null = null

export async function loadIndexHtmlTemplate(): Promise<string> {
  if (cachedTemplate && process.env.NODE_ENV === 'production') {
    return cachedTemplate
  }

  const isProd = process.env.NODE_ENV === 'production'

  // In production the server is bundled into dist/index.js by hono/vite-build.
  // import.meta.url points at that file, so dirname(import.meta.url) == dist/.
  // Walking up one level from dist/ gives us the project root.
  let root = process.cwd()
  if (isProd) {
    try {
      const bundledFileDir = dirname(fileURLToPath(import.meta.url))
      root = join(bundledFileDir, '..')
    } catch {
      // Keep process.cwd() as fallback.
    }
  }

  const candidates = isProd
    ? [join(root, 'dist/client/index.html'), join(process.cwd(), 'dist/client/index.html')]
    : [join(root, 'index.html'), join(root, 'dist/client/index.html')]

  for (const file of candidates) {
    if (existsSync(file)) {
      const html = await readFile(file, 'utf-8')
      if (isProd) {
        cachedTemplate = html
      }
      return html
    }
  }

  // biome-ignore lint/suspicious/noConsole: critical production diagnostics
  console.error('[index-html] NODE_ENV:', process.env.NODE_ENV)
  // biome-ignore lint/suspicious/noConsole: critical production diagnostics
  console.error('[index-html] Resolved root:', root)
  // biome-ignore lint/suspicious/noConsole: critical production diagnostics
  console.error('[index-html] Checked candidates:', candidates)
  throw new Error('index.html template not found')
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export function injectCspNonceIntoHtml(html: string, nonce: string): string {
  const escaped = escapeHtmlAttribute(nonce)
  return html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${escaped}"`)
}

export async function renderDocumentHtml(meta: PageMeta, options?: { cspNonce?: string }): Promise<string> {
  const template = await loadIndexHtmlTemplate()
  let html = injectPageMetaIntoHtml(template, meta, options)

  if (options?.cspNonce) {
    html = injectCspNonceIntoHtml(html, options.cspNonce)
  }

  return html
}

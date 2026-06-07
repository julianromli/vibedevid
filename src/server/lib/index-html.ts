import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { injectPageMetaIntoHtml } from '@/lib/seo/render-meta'
import type { PageMeta } from '@/lib/seo/types'

let cachedTemplate: string | null = null

export async function loadIndexHtmlTemplate(): Promise<string> {
  if (cachedTemplate && process.env.NODE_ENV === 'production') {
    return cachedTemplate
  }

  const candidates =
    process.env.NODE_ENV === 'production'
      ? [join(process.cwd(), 'dist/client/index.html'), join(process.cwd(), 'index.html')]
      : [join(process.cwd(), 'index.html'), join(process.cwd(), 'dist/client/index.html')]

  for (const file of candidates) {
    if (existsSync(file)) {
      const html = await readFile(file, 'utf-8')
      if (process.env.NODE_ENV === 'production') {
        cachedTemplate = html
      }
      return html
    }
  }

  throw new Error('index.html template not found')
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export async function renderDocumentHtml(meta: PageMeta, options?: { cspNonce?: string }): Promise<string> {
  const template = await loadIndexHtmlTemplate()
  let html = injectPageMetaIntoHtml(template, meta, options)

  if (options?.cspNonce) {
    const nonceMeta = `<meta name="csp-nonce" content="${escapeHtmlAttribute(options.cspNonce)}" />`
    html = html.replace('</head>', `    ${nonceMeta}\n  </head>`)
  }

  return html
}

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { injectPageMetaIntoHtml } from '@/lib/seo/render-meta'
import type { PageMeta } from '@/lib/seo/types'

let cachedTemplate: string | null = null

export async function loadIndexHtmlTemplate(): Promise<string> {
  if (cachedTemplate && process.env.NODE_ENV === 'production') {
    return cachedTemplate
  }

  const candidates = [
    join(process.cwd(), 'dist/client/index.html'),
    join(process.cwd(), 'index.html'),
  ]

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

export async function renderDocumentHtml(meta: PageMeta): Promise<string> {
  const template = await loadIndexHtmlTemplate()
  return injectPageMetaIntoHtml(template, meta)
}

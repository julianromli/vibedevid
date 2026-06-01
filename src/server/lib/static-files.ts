import { readFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'
import type { Context } from 'hono'

const CLIENT_ROOT = join(process.cwd(), 'dist/client')

const MIME: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

export function hasStaticAssetExtension(pathname: string): boolean {
  const segment = pathname.split('/').pop() ?? ''
  return /\.[a-z0-9]+$/i.test(segment)
}

export function shouldHandleAsDocument(pathname: string): boolean {
  if (pathname.startsWith('/api')) return false
  if (pathname.startsWith('/auth/callback')) return false
  if (pathname.startsWith('/@')) return false
  if (pathname.startsWith('/src/')) return false
  if (pathname.startsWith('/node_modules/')) return false
  if (hasStaticAssetExtension(pathname)) return false
  return true
}

export async function tryServeProductionStatic(c: Context): Promise<Response | null> {
  if (process.env.NODE_ENV !== 'production') return null

  const pathname = new URL(c.req.url).pathname
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '')
  const filePath = normalize(join(CLIENT_ROOT, relative))

  if (!filePath.startsWith(CLIENT_ROOT) || !existsSync(filePath)) {
    return null
  }

  const stat = statSync(filePath)
  if (!stat.isFile()) return null

  const body = await readFile(filePath)
  const ext = filePath.slice(filePath.lastIndexOf('.'))
  const type = MIME[ext] ?? 'application/octet-stream'

  return new Response(body, {
    headers: { 'Content-Type': type },
  })
}

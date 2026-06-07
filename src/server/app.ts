import { Hono } from 'hono'
import type { ServerEnv } from '@/src/server/types'
import { cors } from 'hono/cors'
import { resolveCorsOrigin } from '@/src/server/lib/request-security'
import { localeMiddleware } from '@/src/server/middleware/locale'
import { securityHeadersMiddleware } from '@/src/server/middleware/security-headers'
import { supabaseMiddleware } from '@/src/server/middleware/supabase'
import { adminPageRoutes } from '@/src/server/routes/admin-pages'
import { apiRoutes } from '@/src/server/routes/api'
import { authCallbackHandler } from '@/src/server/routes/auth-callback'
import { rpcRoutes } from '@/src/server/routes/rpc'
import { documentHandler, seoRoutes } from '@/src/server/routes/seo'

const app = new Hono<ServerEnv>()

app.use('*', securityHeadersMiddleware())

app.use(
  '*',
  cors({
    origin: resolveCorsOrigin,
    credentials: true,
  }),
)

app.use('*', localeMiddleware)
app.use('/api/*', supabaseMiddleware)
app.use('/auth/callback', supabaseMiddleware)

app.route('/', seoRoutes)
app.route('/api', rpcRoutes)
app.route('/api', apiRoutes)
app.route('/api/admin', adminPageRoutes)

app.get('/api/health', (c) => c.json({ status: 'ok' }))
app.post('/api/client-errors', async (c) => {
  try {
    const body = await c.req.json()
    // biome-ignore lint/suspicious/noConsole: server-side client error ingest for production diagnostics
    console.error('[client-error]', body)
  } catch {
    // Ignore malformed payloads.
  }
  return c.body(null, 204)
})
app.get('/auth/callback', authCallbackHandler)

app.all('*', async (c, next) => {
  const document = await documentHandler(c)
  if (document) return document
  await next()
})

export default app

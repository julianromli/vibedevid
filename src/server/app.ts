import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { localeMiddleware } from '@/src/server/middleware/locale'
import { supabaseMiddleware } from '@/src/server/middleware/supabase'
import { adminPageRoutes } from '@/src/server/routes/admin-pages'
import { apiRoutes } from '@/src/server/routes/api'
import { authCallbackHandler } from '@/src/server/routes/auth-callback'
import { rpcRoutes } from '@/src/server/routes/rpc'
import { documentHandler, seoRoutes } from '@/src/server/routes/seo'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
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
app.get('/auth/callback', authCallbackHandler)

app.all('*', async (c, next) => {
  const document = await documentHandler(c)
  if (document) return document
  await next()
})

export default app

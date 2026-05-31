import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { fileURLToPath } from 'node:url'
import app from './app.js'

const port = Number(process.env.PORT || 3000)
const root = fileURLToPath(new URL('../../dist/client', import.meta.url))

app.use('/*', serveStatic({ root }))
app.use('/*', serveStatic({ root, path: 'index.html' }))

console.log(`VibeDev ID listening on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

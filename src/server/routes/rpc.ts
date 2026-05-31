import { Hono } from 'hono'
import { isServerRedirect } from '@/lib/navigation-server'
import { rpcRegistry } from '../rpc/registry'

export const rpcRoutes = new Hono()

rpcRoutes.post('/rpc', async (c) => {
  const body = await c.req.json<{ procedure: string; args: unknown[] }>()
  const handler = rpcRegistry[body.procedure]

  if (!handler) {
    return c.json({ ok: false, error: `Unknown procedure: ${body.procedure}` }, 404)
  }

  const args = (body.args ?? []).map((arg: unknown) => {
    if (arg && typeof arg === 'object' && '__formData' in arg) {
      const record = (arg as { __formData: Record<string, string> }).__formData
      const formData = new FormData()
      for (const [key, value] of Object.entries(record)) {
        formData.set(key, value)
      }
      return formData
    }
    return arg
  })

  try {
    const data = await handler(...args)
    return c.json({ ok: true, data })
  } catch (error) {
    if (isServerRedirect(error)) {
      return c.json({ ok: true, redirect: error.url })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[RPC] ${body.procedure} failed:`, error)
    return c.json({ ok: false, error: message }, 500)
  }
})

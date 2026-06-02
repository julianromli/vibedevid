import { Hono } from 'hono'
import { ROLES } from '@/lib/actions/admin/schemas'
import { isServerRedirect } from '@/lib/navigation-server'
import { createClient } from '@/lib/supabase/server'
import { isSameOriginRequest } from '@/src/server/lib/request-security'
import { rpcRegistry } from '../rpc/registry'

export const rpcRoutes = new Hono()

const PUBLIC_PROCEDURES = new Set([
  'actions.signIn',
  'actions.signUp',
  'actions.signOut',
  'actions.resetPassword',
  'actions.resendConfirmationEmail',
  'actions.signInWithGoogle',
  'actions.signInWithGitHub',
  'actions.getProjectBySlug',
  'actions.getProject',
  'actions.incrementProjectViews',
  'actions.incrementBlogPostViews',
  'actions.fetchProjectsWithSorting',
  'actions.getLikeStatus',
  'actions.getBatchLikeStatus',
  'blog.getTags',
  'blog.getAuthorPosts',
  'comments.getComments',
  'events.getEvents',
  'events.getEventBySlug',
  'events.getRelatedEvents',
  'user.getCurrentUser',
  'projects.validateAndNormalizeSubmitProjectInput',
])

const MODERATOR_PROCEDURES = new Set(['events.getPendingEvents', 'events.approveEvent', 'events.rejectEvent'])

function isAdminProcedure(procedure: string): boolean {
  return procedure.startsWith('admin-') || procedure.startsWith('analytics.')
}

async function getSessionRole(): Promise<number | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role ?? null
}

rpcRoutes.post('/rpc', async (c) => {
  if (!isSameOriginRequest(c)) {
    return c.json({ ok: false, error: 'Cross-origin RPC requests are not allowed' }, 403)
  }

  const body = await c.req.json<{ procedure: string; args: unknown[] }>()
  if (!body?.procedure || typeof body.procedure !== 'string' || !Array.isArray(body.args ?? [])) {
    return c.json({ ok: false, error: 'Invalid RPC request' }, 400)
  }

  const handler = rpcRegistry[body.procedure]

  if (!handler) {
    return c.json({ ok: false, error: `Unknown procedure: ${body.procedure}` }, 404)
  }

  if (!PUBLIC_PROCEDURES.has(body.procedure)) {
    const role = await getSessionRole()
    if (role === null) {
      return c.json({ ok: false, error: 'Unauthorized' }, 401)
    }

    if (isAdminProcedure(body.procedure) && role !== ROLES.ADMIN) {
      return c.json({ ok: false, error: 'Forbidden' }, 403)
    }

    if (MODERATOR_PROCEDURES.has(body.procedure) && role !== ROLES.ADMIN && role !== ROLES.MODERATOR) {
      return c.json({ ok: false, error: 'Forbidden' }, 403)
    }
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
    return c.json({ ok: false, error: message }, 500)
  }
})

import { ServerRedirect } from '@/lib/navigation-server'

export type RpcResult<T> = T | { __redirect: string }

function serializeArg(arg: unknown): unknown {
  if (arg instanceof FormData) {
    const record: Record<string, string> = {}
    for (const [key, value] of arg.entries()) {
      if (typeof value === 'string') {
        record[key] = value
      }
    }
    return { __formData: record }
  }
  return arg
}

function deserializeArg(arg: unknown): unknown {
  if (arg && typeof arg === 'object' && '__formData' in arg) {
    const record = (arg as { __formData: Record<string, string> }).__formData
    const formData = new FormData()
    for (const [key, value] of Object.entries(record)) {
      formData.set(key, value)
    }
    return formData
  }
  return arg
}

export async function invokeRpc<T>(procedure: string, args: unknown[]): Promise<T> {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      procedure,
      args: args.map(serializeArg),
    }),
  })

  if (response.status === 302 || response.status === 301) {
    const location = response.headers.get('Location')
    if (location) {
      window.location.href = location
      return undefined as T
    }
  }

  const payload = (await response.json()) as { ok: boolean; data?: T; error?: string; redirect?: string }

  if (payload.redirect) {
    window.location.href = payload.redirect
    return undefined as T
  }

  if (!payload.ok) {
    throw new Error(payload.error ?? 'RPC request failed')
  }

  return payload.data as T
}

export function createRpcAction<TArgs extends unknown[], TResult>(
  procedure: string,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    try {
      return await invokeRpc<TResult>(procedure, args)
    } catch (error) {
      if (error instanceof ServerRedirect) {
        window.location.href = error.url
        return undefined as TResult
      }
      throw error
    }
  }
}

export function formDataFromRpc(arg: unknown): FormData {
  return deserializeArg(arg) as FormData
}

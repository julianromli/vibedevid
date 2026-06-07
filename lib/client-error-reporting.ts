type ClientErrorContext = {
  boundary?: string
  componentStack?: string
}

function clientErrorPath(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return window.location.pathname
}

function serializeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack }
  }
  return { message: String(error) }
}

export function reportClientError(error: unknown, context: ClientErrorContext = {}): void {
  const { message, stack } = serializeError(error)
  const payload = {
    message,
    stack,
    boundary: context.boundary,
    componentStack: context.componentStack,
    path: clientErrorPath(),
    timestamp: new Date().toISOString(),
  }

  if (import.meta.env.DEV) {
    // biome-ignore lint/suspicious/noConsole: dev-only error boundary diagnostics
    console.error('[client-error]', error, context)
    return
  }

  // biome-ignore lint/suspicious/noConsole: production fallback when beacon fails
  console.error('[client-error]', payload)

  if (typeof navigator === 'undefined') return

  try {
    const body = JSON.stringify(payload)
    const sent = navigator.sendBeacon?.('/api/client-errors', new Blob([body], { type: 'application/json' }))
    if (!sent) {
      fetch('/api/client-errors', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Ignore reporting failures — UI fallback still renders.
  }
}

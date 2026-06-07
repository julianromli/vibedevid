export function getClientCspNonce(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const el = document.querySelector('script[nonce]') as HTMLScriptElement | null
  if (!el) return undefined
  return el.nonce || el.getAttribute('nonce') || undefined
}

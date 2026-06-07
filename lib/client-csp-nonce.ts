export function getClientCspNonce(): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content') ?? undefined
}

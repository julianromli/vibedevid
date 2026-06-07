export function getClientCspNonce(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const script = document.querySelector('script[nonce]')
  if (!script) return undefined
  return script.getAttribute('nonce') ?? script.nonce ?? undefined
}

type SocialPlatform = 'github' | 'x' | 'instagram' | 'threads'

const SOCIAL_HOSTS: Record<SocialPlatform, string[]> = {
  github: ['github.com', 'www.github.com'],
  x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  threads: ['threads.net', 'www.threads.net'],
}

const SOCIAL_BASE_URLS: Record<SocialPlatform, string> = {
  github: 'https://github.com/',
  x: 'https://x.com/',
  instagram: 'https://instagram.com/',
  threads: 'https://www.threads.net/@',
}

function parseHttpUrl(value: string): URL | null {
  const withScheme = /^[a-z][a-z\d+\-.]*:\/\//i.test(value) ? value : `https://${value}`

  try {
    const url = new URL(withScheme)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function looksLikeUrl(value: string, platform?: SocialPlatform): boolean {
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(value) || value.startsWith('www.')) {
    return true
  }

  if (platform) {
    return SOCIAL_HOSTS[platform].some((host) => value === host || value.startsWith(`${host}/`))
  }

  return value.includes('.') && !value.startsWith('@')
}

function normalizeHandle(value: string): string {
  return value.trim().replace(/^@+/, '').replace(/^\/+/, '').split(/[/?#]/)[0]?.replace(/^@+/, '') || ''
}

export function normalizeProfileWebsiteUrl(input: string | null | undefined): string {
  const value = input?.trim()
  if (!value) return ''

  const url = parseHttpUrl(value)
  return url?.toString() || value
}

export function normalizeProfileSocialUrl(platform: SocialPlatform, input: string | null | undefined): string {
  const value = input?.trim()
  if (!value) return ''

  if (looksLikeUrl(value, platform)) {
    const url = parseHttpUrl(value)
    if (url) return url.toString()
  }

  const handle = normalizeHandle(value)
  return handle ? `${SOCIAL_BASE_URLS[platform]}${handle}` : ''
}

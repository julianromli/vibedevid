export class ServerRedirect extends Error {
  readonly url: string

  constructor(url: string) {
    super(`REDIRECT:${url}`)
    this.name = 'ServerRedirect'
    this.url = url
  }
}

/** Throws ServerRedirect — caught by Hono RPC/auth handlers. */
export function redirect(url: string): never {
  throw new ServerRedirect(url)
}

export function isServerRedirect(error: unknown): error is ServerRedirect {
  return error instanceof ServerRedirect
}

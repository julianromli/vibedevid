export function notFound(): never {
  throw new Response('Not Found', { status: 404 })
}

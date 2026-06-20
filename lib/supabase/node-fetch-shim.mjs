// Shim for `@supabase/node-fetch` used on Cloudflare Workers.
//
// The real package imports `node:http` / `node:https`, which are unavailable
// on Workers even with `nodejs_compat`. supabase-js only needs a WHATWG
// `fetch`/`Headers`/`Request`/`Response`, all of which Workers provides
// natively. We re-export the globals so no Node http stack is pulled in.

const fetchImpl = (...args) => globalThis.fetch(...args);

export default fetchImpl;
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
export const FetchError = globalThis.Error;

import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  // Validate that supabaseUrl is actually a URL
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}. Must be a valid URL.`)
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Environment configuration with fallbacks for build-time safety
export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, provide fallbacks to prevent build failures
  const isDuringBuild = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build'
  
  if (isDuringBuild && (!url || !anonKey)) {
    console.warn('Missing Supabase environment variables during build. Using fallback values.')
    return {
      url: 'https://placeholder.supabase.co',
      anonKey: 'placeholder-anon-key'
    }
  }

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    if (isDuringBuild) {
      console.warn(`Invalid NEXT_PUBLIC_SUPABASE_URL during build: ${url}. Using fallback.`)
      return {
        url: 'https://placeholder.supabase.co',
        anonKey: 'placeholder-anon-key'
      }
    }
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${url}. Must be a valid URL.`)
  }

  return { url, anonKey }
}

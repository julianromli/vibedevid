// Environment configuration with fallbacks for build-time safety
export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // More comprehensive build detection for Vercel and other platforms
  const isDuringBuild = 
    process.env.NODE_ENV === 'production' && 
    (process.env.NEXT_PHASE === 'phase-production-build' || 
     process.env.VERCEL === '1' && !process.env.VERCEL_ENV ||
     process.env.CI === 'true')
  
  // Check if environment variables are missing or have invalid format
  const hasValidUrl = url && url.startsWith('http')
  const hasValidAnonKey = anonKey && anonKey.length > 10
  
  if (isDuringBuild && (!hasValidUrl || !hasValidAnonKey)) {
    console.warn('Missing or invalid Supabase environment variables during build. Using fallback values.')
    console.warn('NEXT_PUBLIC_SUPABASE_URL:', url ? '[SET]' : '[MISSING]')
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '[SET]' : '[MISSING]')
    return {
      url: 'https://placeholder.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk4NzQzOTIsImV4cCI6MTk2NTQ1MDM5Mn0.placeholder'
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
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk4NzQzOTIsImV4cCI6MTk2NTQ1MDM5Mn0.placeholder'
      }
    }
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${url}. Must be a valid URL.`)
  }

  return { url, anonKey }
}

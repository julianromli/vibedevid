// Environment configuration with fallbacks for build-time safety
function readPublicEnv(name: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteKey = `VITE_${name.replace(/^NEXT_PUBLIC_/, '')}` as keyof ImportMetaEnv
    const viteValue = import.meta.env[viteKey]
    if (typeof viteValue === 'string' && viteValue.length > 0) {
      return viteValue
    }
  }

  return process.env[name] || ''
}

export const getSupabaseConfig = () => {
  const url = readPublicEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = readPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // SIMPLE FIX: Always use fallback during build if URL is invalid
  // Check if URL is valid (must start with http)
  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  // If URL is invalid or missing, use fallback
  if (!isValidUrl) {
    console.warn('Invalid or missing NEXT_PUBLIC_SUPABASE_URL. Using fallback for build.')
    console.warn('Current value:', url || '[EMPTY]')
    return {
      url: 'https://placeholder.supabase.co',
      anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk4NzQzOTIsImV4cCI6MTk2NTQ1MDM5Mn0.placeholder',
    }
  }

  // If we have a valid URL but missing anon key, still use fallback
  if (!anonKey) {
    console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Using fallback for build.')
    return {
      url: 'https://placeholder.supabase.co',
      anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk4NzQzOTIsImV4cCI6MTk2NTQ1MDM5Mn0.placeholder',
    }
  }

  return { url, anonKey }
}

export const getSupabaseServerConfig = () => {
  const url = readPublicEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  // Check if URL is valid (must start with http)
  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  // If URL is invalid or missing, use fallback
  if (!isValidUrl) {
    console.warn('Invalid or missing NEXT_PUBLIC_SUPABASE_URL for server. Using fallback.')
    return {
      url: 'https://placeholder.supabase.co',
      serviceRoleKey: 'placeholder-service-role-key',
    }
  }

  // If we have a valid URL but missing service role key, still use fallback
  if (!serviceRoleKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Using fallback for server operations.')
    return {
      url: 'https://placeholder.supabase.co',
      serviceRoleKey: 'placeholder-service-role-key',
    }
  }

  return { url, serviceRoleKey }
}

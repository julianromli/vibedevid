import { getSiteUrl } from '@/lib/seo/site-url'

function readEnv(key: string): string {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key] ?? ''
  }
  return ''
}

function getPublicSupabaseUrl(): string {
  return (
    readEnv('VITE_SUPABASE_URL') ||
    readEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    ''
  )
}

function getPublicSupabaseAnonKey(): string {
  return (
    readEnv('VITE_SUPABASE_ANON_KEY') ||
    readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    ''
  )
}

export function getSiteUrlFromEnv(): string {
  return getSiteUrl()
}

// Environment configuration with fallbacks for build-time safety
export const getSupabaseConfig = () => {
  const url = getPublicSupabaseUrl()
  const anonKey = getPublicSupabaseAnonKey()

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  if (!isValidUrl) {
    console.warn('Invalid or missing Supabase URL. Using fallback for build.')
    return {
      url: 'https://placeholder.supabase.co',
      anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk4NzQzOTIsImV4cCI6MTk2NTQ1MDM5Mn0.placeholder',
    }
  }

  if (!anonKey) {
    console.warn('Missing Supabase anon key. Using fallback for build.')
    return {
      url: 'https://placeholder.supabase.co',
      anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk4NzQzOTIsImV4cCI6MTk2NTQ1MDM5Mn0.placeholder',
    }
  }

  return { url, anonKey }
}

export const getSupabaseServerConfig = () => {
  const url = getPublicSupabaseUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  if (!isValidUrl) {
    console.warn('Invalid or missing Supabase URL for server. Using fallback.')
    return {
      url: 'https://placeholder.supabase.co',
      serviceRoleKey: 'placeholder-service-role-key',
    }
  }

  if (!serviceRoleKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Using fallback for server operations.')
    return {
      url: 'https://placeholder.supabase.co',
      serviceRoleKey: 'placeholder-service-role-key',
    }
  }

  return { url, serviceRoleKey }
}

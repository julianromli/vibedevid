import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerConfig } from '../env-config'

// Admin client dengan service role key untuk server-side operations
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerConfig()

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

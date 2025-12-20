import { createClient } from '@/lib/supabase/server'

export function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export async function getProjectByUUID(uuid: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('slug').eq('id', uuid).single()

  return data
}

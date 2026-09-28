/**
 * Delete demo rows created by `bun run db:seed`.
 *
 * Safe on production: only seed ids, emails, usernames, slugs, and the
 * demo video / testimonial copy are removed. Real member content stays.
 *
 *   bun run db:purge-seed
 */

import { purgeSeedRows } from '@/lib/server/purge-seed-content'
import { loadSeedEnv } from './seed/env'

async function main() {
  loadSeedEnv()
  const result = await purgeSeedRows()
  if (result.removed) {
    console.log('Demo seed rows deleted.')
    return
  }
  console.log('No demo seed rows found.')
}

main().catch((error: unknown) => {
  console.log(error instanceof Error ? error.message : error)
  process.exit(1)
})

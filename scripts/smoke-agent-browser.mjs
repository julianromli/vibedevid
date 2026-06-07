#!/usr/bin/env bun
/**
 * Pre-deploy smoke checks via agent-browser CLI (not Playwright).
 * Prereqs: dev server running (`bun run dev`) and Chromium installed once:
 *   npx agent-browser@latest install
 */
import { spawnSync } from 'node:child_process'

const BASE = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5173'
const HEADED =
  process.argv.includes('--headed') || process.env.AGENT_BROWSER_HEADED === '1'

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  if (result.status !== 0) {
    throw new Error(out || `Command failed: ${command} ${args.join(' ')}`)
  }
  return out
}

function abArgs(...args) {
  const prefix = HEADED ? ['--headed'] : []
  return ['agent-browser@latest', ...prefix, ...args]
}

function runAb(...args) {
  return runCommand('npx', abArgs(...args))
}

function lastLine(output) {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.at(-1) ?? ''
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`${label}\nExpected substring: ${needle}\nGot:\n${haystack}`)
  }
}

function checkHealth() {
  const res = spawnSync('curl', ['-fsS', `${BASE}/api/health`], {
    encoding: 'utf8',
    shell: false,
  })
  if (res.status !== 0) {
    throw new Error(`API health failed. Is the dev server running at ${BASE}?`)
  }
  assertIncludes(res.stdout ?? '', '"status":"ok"', 'API /api/health')
  console.log('✓ API /api/health')
}

function runBrowserChecks() {
  runAb('open', `${BASE}/`)
  runAb('wait', '--load', 'networkidle')
  const homeOut = runAb('get', 'title')
  assertIncludes(lastLine(homeOut), 'VibeDev', 'Homepage title')
  console.log('✓ Homepage loads')

  runAb('open', `${BASE}/admin`)
  runAb('wait', '5000')
  const adminOut = runAb('eval', 'window.location.href')
  const adminUrl = lastLine(adminOut).replace(/^"|"$/g, '')
  assertIncludes(adminUrl, '/user/auth', 'Anon /admin → auth redirect')
  console.log('✓ /admin gates anonymous users (redirect to auth)')

  runAb('open', `${BASE}/zz-no-such-user-smoke`)
  runAb('wait', '--text', 'Page not found')
  console.log('✓ Unknown username shows 404 page')

  runAb('open', `${BASE}/project`)
  runAb('wait', '--text', 'Page not found')
  console.log('✓ Reserved /project shows 404 page')

  runAb('close')
}

console.log(`Smoke (agent-browser) → ${BASE}\n`)

checkHealth()
runBrowserChecks()

console.log('\nAll smoke checks passed.')

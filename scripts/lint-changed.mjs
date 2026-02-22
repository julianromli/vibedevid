import { execSync, spawnSync } from 'node:child_process'

const BIOME_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json'])
const IGNORE_PREFIXES = ['node_modules/', '.next/', 'playwright-report/', 'test-results/']

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8' })
  } catch {
    return ''
  }
}

function parseLines(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function getExtension(path) {
  const dotIndex = path.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return path.slice(dotIndex)
}

function getChangedFiles() {
  const unstaged = parseLines(run('git -c core.safecrlf=false diff --name-only --diff-filter=ACMR'))
  const staged = parseLines(run('git -c core.safecrlf=false diff --cached --name-only --diff-filter=ACMR'))
  const untracked = parseLines(run('git ls-files --others --exclude-standard'))
  const allFiles = [...unstaged, ...staged, ...untracked]

  return [...new Set(allFiles)].filter((file) => {
    const normalized = file.replace(/\\/g, '/')
    if (IGNORE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      return false
    }

    return BIOME_EXTENSIONS.has(getExtension(normalized))
  })
}

const files = getChangedFiles()

if (files.length === 0) {
  console.log('No changed files to lint.')
  process.exit(0)
}

const result = spawnSync('bunx', ['biome', 'check', '--no-errors-on-unmatched', ...files], {
  stdio: 'inherit',
})

if (typeof result.status === 'number') {
  process.exit(result.status)
}

if (result.error) {
  console.error(result.error.message)
}

process.exit(1)

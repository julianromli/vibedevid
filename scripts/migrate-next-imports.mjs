import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIRS = ['components', 'lib', 'hooks', 'app']
const SKIP_PARTS = [`${path.sep}admin-kit${path.sep}`, `${path.sep}app${path.sep}routes${path.sep}`]

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_PARTS.some((p) => full.includes(p))) continue
      yield* walk(full)
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      yield full
    }
  }
}

function migrate(content, filePath) {
  let original = content
  let changed = false

  const mark = (next) => {
    if (next !== content) {
      content = next
      changed = true
    }
  }

  // 6. Remove 'use server'
  if (filePath.includes(`${path.sep}lib${path.sep}actions`)) {
    mark(content.replace(/^['"]use server['"]\s*\r?\n/m, ''))
  }
  if (filePath.endsWith(`${path.sep}lib${path.sep}actions.ts`)) {
    mark(content.replace(/^['"]use server['"]\s*\r?\n/m, ''))
  }

  // 4. next/cache → revalidation
  mark(
    content
      .replace(
        /import\s*\{([^}]*)\}\s*from\s*['"]next\/cache['"]/g,
        (m, imports) => {
          const names = imports.split(',').map((s) => s.trim()).filter(Boolean)
          return `import { ${names.join(', ')} } from '@/lib/revalidation'`
        },
      ),
  )

  // 1. next/link
  mark(content.replace(/import\s+Link\s+from\s+['"]next\/link['"]/g, "import { Link } from '@tanstack/react-router'"))

  // 3. next/image default import
  mark(
    content.replace(/import\s+Image\s+from\s+['"]next\/image['"]/g, "import { Image } from '@unpic/react'"),
  )

  // 3b. next/image type/prop imports → local stubs
  mark(
    content.replace(
      /import\s+type\s*\{\s*ImageProps(?:\s*,\s*StaticImageData)?\s*\}\s*from\s+['"]next\/image['"]/g,
      "import type { ImageProps, StaticImageData } from '@/lib/image-types'",
    ),
  )
  mark(
    content.replace(
      /import\s+type\s*\{\s*StaticImageData\s*,\s*ImageProps\s*\}\s*from\s+['"]next\/image['"]/g,
      "import type { ImageProps, StaticImageData } from '@/lib/image-types'",
    ),
  )
  mark(
    content.replace(
      /import\s+type\s*\{\s*ImageProps\s*\}\s*from\s+['"]next\/image['"]/g,
      "import type { ImageProps } from '@/lib/image-types'",
    ),
  )
  mark(
    content.replace(
      /import\s*\{\s*getImageProps\s*\}\s*from\s+['"]next\/image['"]/g,
      "import { getImageProps } from '@/lib/image-types'",
    ),
  )

  // 2. next/navigation → navigation helper or tanstack
  const navImports = new Set()
  const navMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]next\/navigation['"]/)
  if (navMatch) {
    const names = navMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const name of names) {
      if (name === 'useParams') navImports.add('useParams')
      else if (name === 'useRouter') navImports.add('useRouter')
      else if (name === 'usePathname') navImports.add('usePathname')
      else if (name === 'useSearchParams') navImports.add('useSearchParams')
      else if (name === 'redirect') navImports.add('redirect')
      else if (name === 'notFound') navImports.add('notFound')
    }
    const from =
      navImports.size > 0 && [...navImports].every((n) =>
        ['useRouter', 'usePathname', 'useSearchParams', 'redirect', 'notFound'].includes(n),
      ) && !navImports.has('useParams')
        ? '@/lib/navigation'
        : '@tanstack/react-router'
    const importLine = `import { ${[...navImports].join(', ')} } from '${from}'`
    mark(content.replace(/import\s*\{[^}]+\}\s*from\s*['"]next\/navigation['"]/g, importLine))
  }

  // Mixed: useParams goes to tanstack, others to navigation - handle combined import
  if (content.includes("from 'next/navigation'") || content.includes('from "next/navigation"')) {
    const m = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]next\/navigation['"]/)
    if (m) {
      const names = m[1].split(',').map((s) => s.trim()).filter(Boolean)
      const tanstack = names.filter((n) => n === 'useParams')
      const nav = names.filter((n) => n !== 'useParams')
      const lines = []
      if (tanstack.length) lines.push(`import { ${tanstack.join(', ')} } from '@tanstack/react-router'`)
      if (nav.length) lines.push(`import { ${nav.join(', ')} } from '@/lib/navigation'`)
      mark(content.replace(/import\s*\{[^}]+\}\s*from\s*['"]next\/navigation['"]/g, lines.join('\n')))
    }
  }

  // 5. next/headers cookies
  if (content.includes("from 'next/headers'") || content.includes('from "next/headers"')) {
    mark(
      content.replace(
        /import\s*\{\s*cookies\s*\}\s*from\s*['"]next\/headers['"]/g,
        "import { getCookie, getCookies, setCookie } from '@tanstack/react-start/server'",
      ),
    )
    // Simple .get('name') pattern
    mark(content.replace(/\(await\s+cookies\(\)\)\.get\((['"`][^'"`]+['"`])\)/g, 'getCookie($1)'))
    mark(content.replace(/cookieStore\.get\((['"`][^'"`]+['"`])\)\?\.value/g, 'getCookie($1)'))
  }

  // 7. next-intl client
  mark(
    content.replace(
      /import\s*\{\s*useLocale\s*,\s*useTranslations\s*\}\s*from\s*['"]next-intl['"]/g,
      "import { useTranslation } from 'react-i18next'\nimport { useLocale } from '@/hooks/use-locale'",
    ),
  )
  mark(
    content.replace(
      /import\s*\{\s*useTranslations\s*,\s*useLocale\s*\}\s*from\s*['"]next-intl['"]/g,
      "import { useTranslation } from 'react-i18next'\nimport { useLocale } from '@/hooks/use-locale'",
    ),
  )
  mark(
    content.replace(
      /import\s*\{\s*useTranslations\s*\}\s*from\s*['"]next-intl['"]/g,
      "import { useTranslation } from 'react-i18next'",
    ),
  )

  // useTranslations('ns') → useTranslation('ns')
  mark(content.replace(/const\s+t\s*=\s*useTranslations\(([^)]*)\)/g, 'const { t } = useTranslation($1)'))
  mark(content.replace(/const\s+tCommon\s*=\s*useTranslations\(([^)]*)\)/g, 'const { t: tCommon } = useTranslation($1)'))
  mark(content.replace(/const\s+t(\w+)\s*=\s*useTranslations\(([^)]*)\)/g, 'const { t: t$1 } = useTranslation($2)'))

  // next-intl server in app files
  mark(
    content.replace(
      /import\s*\{\s*getLocale\s*,\s*getTranslations\s*\}\s*from\s*['"]next-intl\/server['"]/g,
      "import i18n from '@/i18n'",
    ),
  )
  mark(
    content.replace(
      /import\s*\{\s*getTranslations\s*,\s*getLocale\s*\}\s*from\s*['"]next-intl\/server['"]/g,
      "import i18n from '@/i18n'",
    ),
  )
  mark(
    content.replace(
      /import\s*\{\s*getLocale\s*\}\s*from\s*['"]next-intl\/server['"]/g,
      "import i18n from '@/i18n'",
    ),
  )
  mark(
    content.replace(
      /import\s*\{\s*getTranslations\s*\}\s*from\s*['"]next-intl\/server['"]/g,
      "import i18n from '@/i18n'",
    ),
  )

  // Remove NextIntlClientProvider usage - replace with fragment or I18nextProvider if present
  mark(content.replace(/import\s*\{\s*NextIntlClientProvider\s*\}\s*from\s*['"]next-intl['"]\s*\n/g, ''))

  // Link href → to
  mark(content.replace(/<Link(\s[^>]*?)\shref=/g, '<Link$1 to='))
  mark(content.replace(/<Link\s+href=/g, '<Link to='))

  // router.push/replace
  mark(content.replace(/router\.push\((['"`])([^'"`]+)\1\)/g, "router.navigate({ to: '$2' })"))
  mark(content.replace(/router\.push\(`([^`]+)`\)/g, 'router.navigate({ to: `$1` })'))
  mark(content.replace(/router\.push\(([^)]+)\)/g, 'router.navigate({ to: $1 })'))
  mark(
    content.replace(
      /router\.replace\((['"`])([^'"`]+)\1(?:,\s*\{[^}]*\})?\)/g,
      "router.navigate({ to: '$2', replace: true })",
    ),
  )
  mark(content.replace(/router\.replace\(`([^`]+)`\)/g, 'router.navigate({ to: `$1`, replace: true })'))
  mark(content.replace(/router\.replace\(([^)]+)\)/g, 'router.navigate({ to: $1, replace: true })'))

  // notFound() in loaders → throw notFound()
  mark(content.replace(/(?<!throw\s)notFound\(\)/g, 'throw notFound()'))

  // Image: remove unsupported unpic props from JSX (conservative)
  mark(content.replace(/\s+priority=\{[^}]+\}/g, ''))
  mark(content.replace(/\s+priority(?=\s|\/|>)/g, ''))
  mark(content.replace(/\s+sizes="[^"]*"/g, ''))
  mark(content.replace(/\s+sizes=\{[^}]+\}/g, ''))

  // fill images → className
  mark(
    content.replace(
      /(<Image[^>]*?)\s+fill(\s*[^>]*?>)/g,
      (m, before, after) => {
        if (before.includes('className=')) {
          return `${before.replace(/className="([^"]*)"/, 'className="$1 w-full h-full object-cover"')}${after}`
        }
        return `${before} className="w-full h-full object-cover"${after}`
      },
    ),
  )

  return { content, changed: changed && content !== original }
}

async function main() {
  const changedFiles = []
  for (const dir of DIRS) {
    const abs = path.join(ROOT, dir)
    for await (const file of walk(abs)) {
      const text = await readFile(file, 'utf8')
      const { content, changed } = migrate(text, file)
      if (changed) {
        await writeFile(file, content, 'utf8')
        changedFiles.push(path.relative(ROOT, file))
      }
    }
  }
  console.log(`Changed ${changedFiles.length} files:`)
  for (const f of changedFiles.sort()) console.log(f)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

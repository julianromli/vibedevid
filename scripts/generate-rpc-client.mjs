import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

const modules = [
  { id: 'actions', file: 'lib/actions.ts' },
  { id: 'projects', file: 'lib/actions/projects.ts' },
  { id: 'blog', file: 'lib/actions/blog.ts' },
  { id: 'events', file: 'lib/actions/events.ts' },
  { id: 'comments', file: 'lib/actions/comments.ts' },
  { id: 'user', file: 'lib/actions/user.ts' },
  { id: 'analytics', file: 'lib/actions/analytics.ts' },
  { id: 'admin-admins', file: 'lib/actions/admin/admins.ts' },
  { id: 'admin-comments', file: 'lib/actions/admin/comments.ts' },
  { id: 'admin-posts', file: 'lib/actions/admin/posts.ts' },
  { id: 'admin-projects', file: 'lib/actions/admin/projects.ts' },
  { id: 'admin-users', file: 'lib/actions/admin/users.ts' },
]

async function extractExports(filePath) {
  const content = await readFile(path.join(root, filePath), 'utf8')
  const names = []
  for (const match of content.matchAll(/^export async function (\w+)/gm)) {
    names.push(match[1])
  }
  return names
}

async function main() {
  const registry = []

  for (const mod of modules) {
    const exports = await extractExports(mod.file)
    const clientPath = path.join(root, mod.file.replace(/\.ts$/, '.client.ts'))

    const lines = [
      "import { createRpcAction } from '@/lib/rpc-client'",
      '',
      ...exports.map((name) => `export const ${name} = createRpcAction('${mod.id}.${name}')`),
      '',
    ]

    await writeFile(clientPath, lines.join('\n'))

    for (const name of exports) {
      registry.push({ key: `${mod.id}.${name}`, importFile: mod.file, name })
    }
  }

  const registryTs = [
    "import * as actions from '@/lib/actions'",
    "import * as projects from '@/lib/actions/projects'",
    "import * as blog from '@/lib/actions/blog'",
    "import * as events from '@/lib/actions/events'",
    "import * as comments from '@/lib/actions/comments'",
    "import * as user from '@/lib/actions/user'",
    "import * as analytics from '@/lib/actions/analytics'",
    "import * as adminAdmins from '@/lib/actions/admin/admins'",
    "import * as adminComments from '@/lib/actions/admin/comments'",
    "import * as adminPosts from '@/lib/actions/admin/posts'",
    "import * as adminProjects from '@/lib/actions/admin/projects'",
    "import * as adminUsers from '@/lib/actions/admin/users'",
    '',
    'type RpcHandler = (...args: unknown[]) => Promise<unknown>',
    '',
    'export const rpcRegistry: Record<string, RpcHandler> = {',
    ...registry.map(({ key, importFile, name }) => {
      const mod = modules.find((m) => m.file === importFile)
      const binding = mod.id === 'actions' ? 'actions' : mod.id.replace('admin-', 'admin')
      const map = {
        actions: 'actions',
        projects: 'projects',
        blog: 'blog',
        events: 'events',
        comments: 'comments',
        user: 'user',
        analytics: 'analytics',
        'admin-admins': 'adminAdmins',
        'admin-comments': 'adminComments',
        'admin-posts': 'adminPosts',
        'admin-projects': 'adminProjects',
        'admin-users': 'adminUsers',
      }
      const ns = map[mod.id]
      return `  '${key}': ${ns}.${name} as RpcHandler,`
    }),
    '}',
    '',
  ]

  await writeFile(path.join(root, 'src/server/rpc/registry.ts'), registryTs.join('\n'))
  console.log(`Generated ${registry.length} RPC handlers`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

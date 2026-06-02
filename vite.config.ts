import path from 'node:path'
import build from '@hono/vite-build/node'
import devServer, { defaultOptions } from '@hono/vite-dev-server'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const actionClientAliases: Record<string, string> = {
  '@/lib/actions/admin/schemas': path.resolve(__dirname, 'lib/actions/admin/schemas.ts'),
  '@/lib/actions/admin/admins': path.resolve(__dirname, 'lib/actions/admin/admins.client.ts'),
  '@/lib/actions/admin/comments': path.resolve(__dirname, 'lib/actions/admin/comments.client.ts'),
  '@/lib/actions/admin/posts': path.resolve(__dirname, 'lib/actions/admin/posts.client.ts'),
  '@/lib/actions/admin/projects': path.resolve(__dirname, 'lib/actions/admin/projects.client.ts'),
  '@/lib/actions/admin/users': path.resolve(__dirname, 'lib/actions/admin/users.client.ts'),
  '@/lib/actions/projects': path.resolve(__dirname, 'lib/actions/projects.client.ts'),
  '@/lib/actions/comments': path.resolve(__dirname, 'lib/actions/comments.client.ts'),
  '@/lib/actions/analytics': path.resolve(__dirname, 'lib/actions/analytics.client.ts'),
  '@/lib/actions/events': path.resolve(__dirname, 'lib/actions/events.client.ts'),
  '@/lib/actions/blog': path.resolve(__dirname, 'lib/actions/blog.client.ts'),
  '@/lib/actions/user': path.resolve(__dirname, 'lib/actions/user.client.ts'),
  '@/lib/actions': path.resolve(__dirname, 'lib/actions.client.ts'),
}

const compatAliases = {
  'next/dynamic': path.resolve(__dirname, 'src/client/compat/dynamic.tsx'),
  'next/link': path.resolve(__dirname, 'src/client/compat/link.tsx'),
  'next/navigation': path.resolve(__dirname, 'src/client/compat/navigation.ts'),
  'next/image': path.resolve(__dirname, 'src/client/compat/image.tsx'),
  'next/font/google': path.resolve(__dirname, 'src/client/compat/fonts.ts'),
  'next/script': path.resolve(__dirname, 'src/client/compat/script.tsx'),
  'next-intl/server': path.resolve(__dirname, 'src/client/compat/next-intl-server.ts'),
  'next-intl/routing': path.resolve(__dirname, 'src/client/compat/next-intl-routing.ts'),
  'next-intl': path.resolve(__dirname, 'src/client/compat/next-intl.ts'),
  '@vercel/analytics/next': path.resolve(__dirname, 'src/client/compat/empty.tsx'),
  '@vercel/speed-insights/next': path.resolve(__dirname, 'src/client/compat/empty.tsx'),
}

const actionServerAliases: Record<string, string> = {
  '@/lib/actions/admin/schemas': path.resolve(__dirname, 'lib/actions/admin/schemas.ts'),
  '@/lib/actions/admin/admins': path.resolve(__dirname, 'lib/actions/admin/admins.ts'),
  '@/lib/actions/admin/comments': path.resolve(__dirname, 'lib/actions/admin/comments.ts'),
  '@/lib/actions/admin/posts': path.resolve(__dirname, 'lib/actions/admin/posts.ts'),
  '@/lib/actions/admin/projects': path.resolve(__dirname, 'lib/actions/admin/projects.ts'),
  '@/lib/actions/admin/users': path.resolve(__dirname, 'lib/actions/admin/users.ts'),
  '@/lib/actions/projects': path.resolve(__dirname, 'lib/actions/projects.ts'),
  '@/lib/actions/comments': path.resolve(__dirname, 'lib/actions/comments.ts'),
  '@/lib/actions/analytics': path.resolve(__dirname, 'lib/actions/analytics.ts'),
  '@/lib/actions/events': path.resolve(__dirname, 'lib/actions/events.ts'),
  '@/lib/actions/blog': path.resolve(__dirname, 'lib/actions/blog.ts'),
  '@/lib/actions/user': path.resolve(__dirname, 'lib/actions/user.ts'),
  '@/lib/actions': path.resolve(__dirname, 'lib/actions.ts'),
}

const serverEnvKeys = ['SUPABASE_SERVICE_ROLE_KEY'] as const

function loadServerEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), '')

  for (const key of serverEnvKeys) {
    if (env[key] && !process.env[key]) {
      process.env[key] = env[key]
    }
  }
}

const clientResolve = {
  alias: {
    ...actionClientAliases,
    ...compatAliases,
  },
}

export default defineConfig(({ mode }) => {
  loadServerEnv(mode)

  if (mode === 'client') {
    return {
      plugins: [react(), tsconfigPaths()],
      resolve: clientResolve,
      build: {
        outDir: 'dist/client',
        emptyOutDir: true,
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'),
        },
      },
    }
  }

  if (mode === 'server') {
    return {
      plugins: [
        tsconfigPaths(),
        build({
          entry: './src/server/app.ts',
          port: Number(process.env.PORT || 5173),
        }),
      ],
      resolve: {
        alias: actionServerAliases,
      },
      build: {
        outDir: 'dist/server',
        emptyOutDir: true,
      },
    }
  }

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      devServer({
        entry: './src/server/app.ts',
        exclude: [
          // Let Vite serve + transform index.html and SPA routes in dev.
          /^(?!\/api(?:\/|$)|\/robots\.txt|\/sitemap\.xml|\/auth\/callback(?:\/|$)).*/,
          /.*\.json(\?.*)?$/,
          ...defaultOptions.exclude,
        ],
      }),
    ],
    resolve: clientResolve,
    environments: {
      ssr: {
        resolve: {
          alias: actionServerAliases,
        } as never,
      },
    },
    server: {
      host: '127.0.0.1',
      port: Number(process.env.PORT || 5173),
    },
  }
})

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { I18nextProvider, useTranslation } from 'react-i18next'
import NotFoundError from '@/components/errors/not-found-error'
import { AgentationProvider } from '@/components/agentation-provider'
import { ClientThemeProvider } from '@/components/client-theme-provider'
import { Toaster } from '@/components/ui/sonner'
import i18n from '@/i18n'
import { getCurrentUserFn } from '@/lib/actions/user.functions'
import { getSiteUrl } from '@/lib/seo/site-url'
import appCss from '../globals.css?url'

export const Route = createRootRoute({
  beforeLoad: async () => {
    // Single source of truth for the authenticated user across all routes.
    const currentUser = await getCurrentUserFn()
    return { currentUser }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia' },
      {
        name: 'description',
        content:
          'Komunitas vibe coding terbesar di Indonesia. Showcase project, event, blog, dan belajar coding dengan AI.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/vibedev-guest-avatar.png' },
    ],
  }),
  notFoundComponent: NotFoundError,
  component: RootLayout,
})

function RootLayout() {
  const { t, i18n: i18nInstance } = useTranslation('common')
  const siteUrl = getSiteUrl()
  const shouldLoadVercelInsights = import.meta.env.PROD && import.meta.env.VITE_VERCEL === '1'

  return (
    <html
      lang={i18nInstance.language}
      suppressHydrationWarning
      className="font-sans antialiased"
    >
      <head>
        <HeadContent />
        {import.meta.env.DEV && (
          <script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
          />
        )}
        <link
          rel="preconnect"
          href="https://qabfrhpbfvjcgdrxdlba.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="//cdn.jsdelivr.net"
        />
        <link
          rel="dns-prefetch"
          href="//utfs.io"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'VibeDev ID',
            url: siteUrl,
            logo: `${siteUrl}/vibedevid_final_black.svg`,
            sameAs: ['https://x.com/vibedevid'],
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'VibeDev ID',
            url: siteUrl,
            inLanguage: 'id-ID',
          })}
        </script>
      </head>
      <body suppressHydrationWarning>
        <a
          href="#main-content"
          className="bg-background text-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:ring-2"
        >
          {t('skipToMainContent')}
        </a>
        <I18nextProvider i18n={i18n}>
          <ClientThemeProvider>
            <Outlet />
            <Toaster />
          </ClientThemeProvider>
        </I18nextProvider>
        <AgentationProvider />
        {shouldLoadVercelInsights && null}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if ('serviceWorker' in navigator && typeof window !== 'undefined') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .catch(function() {});
              });
            }
          `,
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}

import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { AgentationProvider } from '@/components/agentation-provider'
import { ClientThemeProvider } from '@/components/client-theme-provider'
import { DefaultRouteError } from '@/components/errors/default-route-error'
import NotFoundError from '@/components/errors/not-found-error'
import { Toaster } from '@/components/ui/sonner'
import i18n, { i18nInit, syncI18nLocale } from '@/i18n'
import { getCurrentUserFn } from '@/lib/actions/user.functions'
import { DEFAULT_LOCALE, ssrLocaleScript } from '@/lib/locale'
import { getLocaleFn } from '@/lib/locale.functions'
import { getSiteUrl } from '@/lib/seo/site-url'
import appCss from '../globals.css?url'

export const Route = createRootRoute({
  beforeLoad: async () => {
    // Single source of truth for the authenticated user across all routes.
    const currentUser = await getCurrentUserFn()
    let locale = DEFAULT_LOCALE
    try {
      locale = await getLocaleFn()
    } catch (error) {
      console.error('Failed to resolve locale:', error)
    }
    await i18nInit
    if (i18n.language !== locale) {
      await i18n.changeLanguage(locale)
    }
    return { currentUser, locale }
  },
  onError: (error) => {
    console.error('Route error:', error)
  },
  errorComponent: DefaultRouteError,
  head: () => {
    const siteUrl = getSiteUrl()
    const ogImage = `${siteUrl}/og-image.png`
    const title = 'VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia'
    const description =
      'Komunitas vibe coding terbesar di Indonesia. Showcase project, event, blog, dan belajar coding dengan AI.'

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title },
        { name: 'description', content: description },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'VibeDev ID' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: siteUrl },
        { property: 'og:image', content: ogImage },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: title },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@vibedevid' },
        { name: 'twitter:creator', content: '@vibedevid' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'icon', type: 'image/svg+xml', href: '/default-favicon.svg' },
        { rel: 'canonical', href: siteUrl },
      ],
    }
  },
  notFoundComponent: NotFoundError,
  component: RootLayout,
})

function RootLayout() {
  const { locale } = Route.useRouteContext()
  syncI18nLocale(locale)
  const { t } = useTranslation('common')
  const siteUrl = getSiteUrl()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className="font-sans antialiased"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ssrLocaleScript(locale) }} />
        <HeadContent />
        {import.meta.env.DEV && (
          <script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
          />
        )}
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
            alternateName: ['Komunitas Vibe Coding Indonesia', 'VibeDev Indonesia'],
            url: siteUrl,
            logo: `${siteUrl}/vibedevid_final_black.svg`,
            description:
              'Komunitas vibe coding Indonesia No. 1 untuk developer, AI enthusiasts, dan tech innovators. Tempat belajar coding pake AI, kolaborasi project open source, dan networking dengan vibe coder Indonesia terbaik.',
            foundingDate: '2024',
            sameAs: ['https://x.com/vibedevid', 'https://github.com/vibedevid', 'https://instagram.com/vibedev.id'],
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'VibeDev ID',
            url: siteUrl,
            inLanguage: 'id-ID',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}/project/list?filter={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.getRegistrations()
                  .then(function(registrations) {
                    return Promise.all(registrations.map(function(registration) {
                      return registration.unregister();
                    }));
                  })
                  .catch(function() {});
                if (window.caches) {
                  caches.keys().then(function(keys) {
                    return Promise.all(keys.map(function(key) {
                      return caches.delete(key);
                    }));
                  }).catch(function() {});
                }
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

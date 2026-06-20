import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { I18nextProvider, useTranslation } from "react-i18next";
import { AgentationProvider } from "@/components/agentation-provider";
import { ClientThemeProvider } from "@/components/client-theme-provider";
import NotFoundError from "@/components/errors/not-found-error";
import { Toaster } from "@/components/ui/sonner";
import i18n from "@/i18n";
import { getCurrentUserFn } from "@/lib/actions/user.functions";
import { getSiteUrl } from "@/lib/seo/site-url";
import appCss from "../globals.css?url";

export const Route = createRootRoute({
  beforeLoad: async () => {
    // Single source of truth for the authenticated user across all routes.
    const currentUser = await getCurrentUserFn();
    return { currentUser };
  },
  head: () => {
    const siteUrl = getSiteUrl();
    const ogImage = `${siteUrl}/og-image.png`;
    const title = "VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia";
    const description =
      "Komunitas vibe coding terbesar di Indonesia. Showcase project, event, blog, dan belajar coding dengan AI.";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "description", content: description },
        // Open Graph
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "VibeDev ID" },
        { property: "og:locale", content: "id_ID" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: siteUrl },
        { property: "og:image", content: ogImage },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: title },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@vibedevid" },
        { name: "twitter:creator", content: "@vibedevid" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/svg+xml", href: "/default-favicon.svg" },
        { rel: "canonical", href: siteUrl },
      ],
    };
  },
  notFoundComponent: NotFoundError,
  component: RootLayout,
});

function RootLayout() {
  const { t, i18n: i18nInstance } = useTranslation("common");
  const siteUrl = getSiteUrl();

  return (
    <html lang={i18nInstance.language} suppressHydrationWarning className="font-sans antialiased">
      <head>
        <HeadContent />
        {import.meta.env.DEV && (
          <script src="//unpkg.com/react-grab/dist/index.global.js" crossOrigin="anonymous" />
        )}
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="//utfs.io" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "VibeDev ID",
            url: siteUrl,
            logo: `${siteUrl}/vibedevid_final_black.svg`,
            sameAs: ["https://x.com/vibedevid"],
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "VibeDev ID",
            url: siteUrl,
            inLanguage: "id-ID",
          })}
        </script>
      </head>
      <body suppressHydrationWarning>
        <a
          href="#main-content"
          className="bg-background text-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:ring-2"
        >
          {t("skipToMainContent")}
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
  );
}

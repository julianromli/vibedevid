/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  compress: true,

  // Advanced bundle optimizations
  bundlePagesRouterDependencies: true, // ✅ Moved to root level (stable in Next.js 15)
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@supabase/supabase-js',
    ],
  },
  // Turbopack configuration (for development with --turbo flag)
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  // Webpack configuration (for production builds and regular dev)
  webpack: (config, { isServer, dev }) => {
    // Only apply external fallbacks, don't force externalize modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    }

    // Ignore specific modules that cause issues in client builds
    if (!isServer) {
      config.externals = config.externals || []

      // Only externalize if really necessary and safely
      config.externals.push(function (context, request, callback) {
        // Skip sharp and native modules entirely in client builds
        if (/^(sharp|detect-libc|plaiceholder)$/.test(request)) {
          return callback(null, `commonjs ${request}`)
        }
        callback()
      })
    }

    return config
  },
  images: {
    // Enable image optimization (remove unoptimized: true)
    formats: ['image/avif', 'image/webp'],

    // Optimized device sizes for modern devices (2024)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for responsive images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache optimization
    minimumCacheTTL: 31536000, // 1 year cache for optimized images

    // Quality settings for different use cases
    qualities: [75, 85],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Remote patterns for external images (Supabase, etc)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'opengraph.githubassets.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/gh/devicons/devicon/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ufs.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.traecommunity.id',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'traecommunity.id',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unpkg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      // Lobe Icons CDN support
      {
        protocol: 'https',
        hostname: 'registry.npmmirror.com',
        port: '',
        pathname: '/@lobehub/icons-static-svg/**',
      },
      {
        protocol: 'https',
        hostname: 'unpkg.com',
        port: '',
        pathname: '/@lobehub/icons-static-svg/**',
      },
      {
        protocol: 'https',
        hostname: 'unpkg.com',
        port: '',
        pathname: '/@lobehub/icons@latest/icons/**',
      },
      // Favicon support for any domain
      {
        protocol: 'https',
        hostname: 'www.google.com',
        port: '',
        pathname: '/s2/favicons**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/favicon.png',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/favicon.svg',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/apple-touch-icon.png',
      },
    ],

    // Loader configuration (default Next.js loader)
    loader: 'default',

    // Disable optimization for specific formats if needed
    unoptimized: false,
  },
}

export default withNextIntl(withBundleAnalyzer(nextConfig))

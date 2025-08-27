/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude sharp and related packages from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Externalize all native node modules for client build
      config.externals.push({
        sharp: 'commonjs sharp',
        'detect-libc': 'commonjs detect-libc',
        'node:child_process': 'commonjs child_process',
        'child_process': 'commonjs child_process',
        'plaiceholder': 'commonjs plaiceholder',
        'node:fs': 'commonjs fs',
        'fs': 'commonjs fs',
        'path': 'commonjs path',
        'node:path': 'commonjs path',
        'node:buffer': 'commonjs buffer',
        'buffer': 'commonjs buffer',
        'node:stream': 'commonjs stream',
        'stream': 'commonjs stream',
        'os': 'commonjs os',
        'node:os': 'commonjs os',
        'util': 'commonjs util',
        'node:util': 'commonjs util'
      })
      
      // Also ensure these modules are resolved as external
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        buffer: false,
        stream: false,
        os: false,
        util: false,
        'child_process': false,
        'detect-libc': false,
        sharp: false,
        plaiceholder: false
      }
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
      }
    ],
    
    // Loader configuration (default Next.js loader)
    loader: 'default',
    
    // Disable optimization for specific formats if needed
    unoptimized: false,
  },
}

export default nextConfig

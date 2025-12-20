// VibeDev ID Service Worker - Mobile Performance Optimization
// Version 1.0.0

const CACHE_NAME = 'vibedevid-v1'
const RUNTIME_CACHE = 'vibedevid-runtime-v1'

// Critical resources untuk immediate caching
const PRECACHE_URLS = [
  '/',
  '/vibedevid_final_black.svg',
  '/vibedevid_final_white.svg',
  '/vibedev-guest-avatar.png',
  '/default-favicon.svg',
  '/manifest.json',
]

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical resources')
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => {
        // Skip waiting untuk immediate activation
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old cache versions
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }),
        )
      })
      .then(() => {
        // Take control immediately
        return self.clients.claim()
      }),
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // Handle different resource types dengan different strategies
  event.respondWith(handleFetch(request))
})

async function handleFetch(request) {
  const url = new URL(request.url)

  try {
    // Strategy 1: Cache First untuk static assets
    if (isStaticAsset(url)) {
      return await cacheFirst(request)
    }

    // Strategy 2: Network First dengan fallback untuk HTML pages
    if (isHTMLPage(url)) {
      return await networkFirstWithFallback(request)
    }

    // Strategy 3: Stale While Revalidate untuk API calls
    if (isAPICall(url)) {
      return await staleWhileRevalidate(request)
    }

    // Strategy 4: Cache First untuk images dengan longer TTL
    if (isImage(url)) {
      return await cacheFirstLongTTL(request)
    }

    // Default: Network First
    return await networkFirst(request)
  } catch (error) {
    console.log('[SW] Fetch error:', error)

    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline fallback untuk HTML pages
    if (isHTMLPage(url)) {
      return await caches.match('/')
    }

    // Network error response
    return new Response('Network error', { status: 503 })
  }
}

// Cache First Strategy - untuk static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

// Network First dengan Fallback - untuk HTML pages
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || (await caches.match('/'))
  }
}

// Stale While Revalidate - untuk API calls
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(RUNTIME_CACHE)
      cache.then((c) => c.put(request, response.clone()))
    }
    return response
  })

  return cachedResponse || (await fetchPromise)
}

// Cache First dengan Long TTL - untuk images
async function cacheFirstLongTTL(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

// Network First - default strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    return (await caches.match(request)) || new Response('Offline', { status: 503 })
  }
}

// Helper functions untuk identify resource types
function isStaticAsset(url) {
  return (
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  )
}

function isHTMLPage(url) {
  return (
    url.pathname === '/' ||
    url.pathname.startsWith('/project/') ||
    url.pathname.startsWith('/user/') ||
    url.pathname.match(/\/[^.]*$/)
  ) // No file extension
}

function isAPICall(url) {
  return url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')
}

function isImage(url) {
  return (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.avif') ||
    url.hostname.includes('supabase.co/storage/') ||
    url.hostname.includes('utfs.io') ||
    url.hostname.includes('googleusercontent.com')
  )
}

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implement background sync logic for offline actions
  console.log('[SW] Performing background sync...')
}

// Push notifications support (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  const options = {
    body: event.data ? event.data.text() : 'New update from VibeDev ID',
    icon: '/vibedev-guest-avatar.png',
    badge: '/vibedev-guest-avatar.png',
    tag: 'vibedevid-notification',
  }

  event.waitUntil(self.registration.showNotification('VibeDev ID', options))
})

console.log('[SW] Service Worker script loaded successfully!')

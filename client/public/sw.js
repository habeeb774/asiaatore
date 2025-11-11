// Enhanced Service Worker for PWA with offline support and caching
const CACHE_NAME = 'my-store-v1.0.0';
const STATIC_CACHE = 'my-store-static-v1.0.0';
const DYNAMIC_CACHE = 'my-store-dynamic-v1.0.0';
const API_CACHE = 'my-store-api-v1.0.0';

// Resources to cache immediately - only existing files
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/logo.svg',
  '/vite.svg'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/products',
  '/api/categories',
  '/api/settings',
  '/api/marketing/features',
  '/api/marketing/banners'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    Promise.all([
      // Cache static assets with error handling
      caches.open(STATIC_CACHE).then(async (cache) => {
        console.log('[SW] Caching static assets');
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { method: 'HEAD' }); // Check if asset exists first
            if (response.ok) {
              const fullResponse = await fetch(asset);
              if (fullResponse.ok) {
                await cache.put(asset, fullResponse);
                console.log('[SW] Cached:', asset);
              }
            }
          } catch (error) {
            console.log('[SW] Skipping unavailable asset:', asset);
          }
        });
        return Promise.all(cachePromises);
      }),

      // Cache critical resources if they exist
      caches.open(CACHE_NAME).then(async (cache) => {
        // Skip critical resources caching in development
        console.log('[SW] Skipping critical resources cache in development');
        return Promise.resolve();
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
      // Don't fail the installation, just continue
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (except allowed domains)
  if (!url.origin.includes(self.location.origin) &&
      !url.origin.includes('cdn.salla.network') &&
      !url.origin.includes('fonts.googleapis.com')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image' ||
      url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle font requests
  if (request.destination === 'font' ||
      url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
    event.respondWith(handleFontRequest(request));
    return;
  }

  // Handle other requests
  event.respondWith(handleDefaultRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache');
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline response for critical endpoints
  if (API_ENDPOINTS.some(endpoint => request.url.includes(endpoint))) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Please check your connection.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return fetch(request);
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  // Check cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch image:', request.url);

    // Return a placeholder for failed images
    return new Response(
      `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="16">
          Image unavailable
        </text>
      </svg>`,
      {
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
}

// Handle font requests with cache-first strategy
async function handleFontRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch font:', request.url);
    return new Response('', { status: 404 });
  }
}

// Handle default requests with stale-while-revalidate
async function handleDefaultRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse);
      }
    }).catch(() => {
      // Ignore background fetch errors
    });

    return cachedResponse;
  }

  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response(
        '<h1>You are offline</h1><p>Please check your internet connection.</p>',
        {
          headers: { 'Content-Type': 'text/html' },
          status: 503
        }
      );
    }

    return new Response('', { status: 404 });
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'New update from My Store!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    image: data.image,
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    silent: false,
    tag: data.tag || 'general'
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'My Store',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Check if there's already a window open with this URL
      const existingClient = clients.find(client =>
        client.url === url || client.url === url + '/'
      );

      if (existingClient) {
        return existingClient.focus();
      }

      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(syncFailedRequests());
  }
});

// Sync failed requests
async function syncFailedRequests() {
  try {
    const cache = await caches.open('failed-requests');
    const keys = await cache.keys();

    await Promise.all(
      keys.map(async (request) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.delete(request);
            console.log('[SW] Successfully synced failed request:', request.url);
          }
        } catch (error) {
          console.log('[SW] Still failed to sync:', request.url);
        }
      })
    );
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      });
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }

  return stats;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}
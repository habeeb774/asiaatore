import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Use env to configure proxy target so frontend links to whichever backend port is running
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://asiaatore-production.up.railway.app'
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: env.VITE_APP_NAME || 'My Store',
          short_name: env.VITE_APP_SHORT_NAME || 'Store',
          description: env.VITE_APP_DESC || 'متجر إلكتروني حديث',
          theme_color: '#69be3c',
          background_color: '#ffffff',
          display: 'standalone',
          dir: 'rtl',
          lang: 'ar',
          scope: '/',
          start_url: '/',
          orientation: 'portrait-primary',
          icons: [
            { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' }
          ]
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,ico}'],
          runtimeCaching: [
            {
              // Only cache same-origin API GET calls; avoid opaque cross-origin and non-GET
              urlPattern: ({ url, request }) => request.method === 'GET' && url.origin === self.location.origin && url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 8,
                cacheableResponse: { statuses: [200] },
                // Do not cache bad responses to avoid Cache.put errors
                fetchOptions: { credentials: 'same-origin' }
              }
            },
            {
              // Cache only same-origin images to prevent opaque responses
              urlPattern: ({ url, request }) => request.destination === 'image' && url.origin === self.location.origin,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'image-cache',
                cacheableResponse: { statuses: [200] },
                matchOptions: { ignoreSearch: true }
              }
            }
          ],
          // Take control ASAP on updates
          clientsClaim: true,
          skipWaiting: true
        },
        // Disable SW in dev to avoid caching stale bundles while debugging
        devOptions: { enabled: false }
      })
    ],
    css: {
      postcss: './postcss.config.cjs'
    },
    server: {
      port: 5173,
      // Allow auto-increment if 5173 is busy to avoid dev startup failures
      strictPort: false,
      open: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
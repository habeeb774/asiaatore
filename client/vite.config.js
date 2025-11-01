import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// The visualizer plugin is optional; import it dynamically at build time
// to avoid hard failures when it's not installed in the environment.

// Resolve and sanitize the proxy target from env.
function resolveProxyTarget(env) {
  const raw = (env?.VITE_PROXY_TARGET || '').trim()
  const fallback = 'http://localhost:8829'
  if (!raw) return fallback
  // If it's only a port number like "4000", assume localhost:http
  if (/^\d{2,5}$/.test(raw)) return `http://localhost:${raw}`
  // If it's host:port without protocol, assume http
  if (/^[^:/\s]+:\d{2,5}$/.test(raw)) return `http://${raw}`
  // If it starts with //example.com, normalize to https://
  if (raw.startsWith('//')) return `https:${raw}`
  // If it misses protocol entirely but looks like a hostname, prefix https://
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`
  // Otherwise assume it is a valid absolute URL
  try {
    const u = new URL(raw)
    // Only keep the origin; path prefixes on target often create double paths like /api/api
    return u.origin
  } catch {
    return fallback
  }
}

// Use env to configure proxy target so frontend links to whichever backend is running
const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const proxyTarget = resolveProxyTarget(env)

  // Dynamically load the visualizer plugin only when requested.
  let visualizerPlugin = null
  if (env.VISUALIZE === 'true' || process.env.VISUALIZE === 'true') {
    try {
      const mod = await import('rollup-plugin-visualizer')
      if (mod && mod.visualizer) {
        visualizerPlugin = mod.visualizer({
          filename: fileURLToPath(new URL('./reports/treemap.html', import.meta.url)),
          template: 'treemap',
          gzipSize: true,
          brotliSize: true
        })
      }
    } catch (e) {
      // Not fatal: continue without visualizer
      console.warn('[vite] rollup-plugin-visualizer not available, skipping treemap')
    }
  }

  return {
    envDir: __dirname,
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
              // Do NOT cache SSE; stream directly
              urlPattern: ({ url, request }) => request.method === 'GET' && url.origin === self.location.origin && url.pathname === '/api/events',
              handler: 'NetworkOnly',
              options: { cacheName: 'sse-bypass' }
            },
            {
              // Products listing endpoints benefit from SWR for fast list load
              urlPattern: ({ url, request }) => request.method === 'GET' && url.origin === self.location.origin && (
                url.pathname === '/api/products' || url.pathname.startsWith('/api/products/') || url.pathname.startsWith('/api/search')
              ),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'products-cache',
                cacheableResponse: { statuses: [200] },
              }
            },
            {
              // Marketing/offers endpoints
              urlPattern: ({ url, request }) => request.method === 'GET' && url.origin === self.location.origin && (
                url.pathname.startsWith('/api/products/offers') || url.pathname.startsWith('/api/products/catalog')
              ),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'offers-catalog-cache',
                cacheableResponse: { statuses: [200] }
              }
            },
            {
              // Generic same-origin API GET calls; fallback to network-first
              urlPattern: ({ url, request }) => request.method === 'GET' && url.origin === self.location.origin && url.pathname.startsWith('/api/') && url.pathname !== '/api/events',
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
      }),
      // Generate a treemap HTML file when VISUALIZE=true is set in environment
      visualizerPlugin
    ],
    build: {
      // Warn earlier about large chunks and help Rollup split common deps
      chunkSizeWarningLimit: 350,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom')) return 'vendor.react-dom'
              if (id.includes('react') && !id.includes('react-dom')) return 'vendor.react'
              if (id.includes('react-router') || id.includes('history') || id.includes('@remix-run')) return 'vendor.router'
              if (id.includes('@tanstack') || id.includes('react-query')) return 'vendor.tanstack'
              if (id.includes('framer-motion')) return 'vendor.motion'
              if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor.leaflet'
              if (id.includes('i18next')) return 'vendor.i18next'
              if (id.includes('zustand')) return 'vendor.zustand'
              if (id.includes('@fontsource') || id.includes('@font-face') || id.includes('fontsource')) return 'vendor.fonts'
              if (id.includes('lodash')) return 'vendor.lodash'
              return 'vendor'
            }
          }
        }
      }
      // Add a small hook to emit a treemap when VISUALIZE=true is set
      ,rollupOptionsHook: undefined
    },
    css: {
      postcss: './postcss.config.cjs'
    },
    server: {
      port: 5173,
      // Allow auto-increment if 5173 is busy to avoid dev startup failures
      strictPort: false,
      open: true,
      // Expose dev server on LAN for testing on real devices
      host: true,
      hmr: {
        // Ensure HMR client connects to the Vite dev server port by default.
        // This project uses port 5173 for the Vite dev server; previously this
        // was set to 4000 which causes the browser to try ws://localhost:4000
        // and fail when the backend isn't proxying HMR. Allow override via
        // VITE_HMR_CLIENT_PORT if needed by developers.
        clientPort: Number(env.VITE_HMR_CLIENT_PORT || 5173),
        host: 'localhost',
        protocol: 'ws',
        overlay: true
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          // Enable WS upgrades if backend enables WebSocket on /api/events behind the same path
          ws: true,
          // Improve Server-Sent Events stability: keep connection alive and avoid timeouts
          proxyTimeout: 0,
          timeout: 0,
          configure: (proxy) => {
            try { console.log(`[vite] Proxying /api -> ${proxyTarget}`) } catch {}
            proxy.on('proxyReq', (proxyReq, req) => {
              // Hint keep-alive for SSE; Vite's http-proxy uses Node http(s)
              proxyReq.setHeader('Connection', 'keep-alive');
              // Ensure Accept header allows text/event-stream for EventSource
              const accepts = req.headers['accept'] || '';
              if (accepts && !/text\/event-stream/.test(accepts)) {
                try { proxyReq.setHeader('Accept', accepts + ', text/event-stream'); } catch {}
              }
            });
            // Optional: surface proxy errors to vite console for visibility
            proxy.on('error', (err, _req, _res) => {
              console.warn('[vite-proxy] /api error:', err?.message || err);
            });
          },
        }
        ,
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
        ,
        '/api/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
// The visualizer plugin is optional; import it dynamically at build time
// to avoid hard failures when it's not installed in the environment.

// Resolve and sanitize the proxy target from env.
function resolveProxyTarget(env) {
  const raw = (env?.VITE_PROXY_TARGET || "8831").trim();
  const fallback =  (env?.VITE_PROXY_TARGET || "8831");
  if (!raw) return fallback;
  // If it's only a port number like "8829", assume localhost:http
  if (/^\d{2,5}$/.test(raw)) return `http://localhost:${raw}`;
  // If it's host:port without protocol, assume http
  if (/^[^:/\s]+:\d{2,5}$/.test(raw)) return `http://${raw}`;
  // If it starts with //example.com, normalize to https://
  if (raw.startsWith("//")) return `https:${raw}`;
  // If it misses protocol entirely but looks like a hostname, prefix https://
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`;
  // Otherwise assume it is a valid absolute URL
  try {
    const u = new URL(raw);
    // Only keep the origin; path prefixes on target often create double paths like /api/api
    return u.origin;
  } catch {
    return fallback;
  }
}

// Use env to configure proxy target so frontend links to whichever backend is running
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const proxyTarget = resolveProxyTarget(env);
  const devMode = mode !== "production";
  const devHeadersEnabled =
    devMode ||
    env.VITE_DEV_HEADERS === "1" ||
    env.VITE_DEV_HEADERS === "true" ||
    env.ALLOW_DEV_HEADERS === "true";
  const devUserId = env.VITE_DEV_USER_ID || "admin";
  const devUserRole = env.VITE_DEV_USER_ROLE || "admin";

  // Dynamically load the visualizer plugin only when requested.
  let visualizerPlugin = null;
  if (env.VISUALIZE === "true" || process.env.VISUALIZE === "true") {
    try {
      const mod = await import("rollup-plugin-visualizer");
      if (mod && mod.visualizer) {
        visualizerPlugin = mod.visualizer({
          filename: fileURLToPath(
            new URL("./reports/treemap.html", import.meta.url)
          ),
          template: "treemap",
          gzipSize: true,
          brotliSize: true,
        });
      }
    } catch {
      // Not fatal: continue without visualizer
      console.warn(
        "[vite] rollup-plugin-visualizer not available, skipping treemap"
      );
    }
  }

  return {
    envDir: __dirname,
    // Dedupe React to avoid "Invalid hook call" in monorepos / linked deps
    // This ensures all packages resolve the same singleton instance
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    define: {
      global: "globalThis",
      process: { env: {}, exit: () => {} },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.svg",
          "favicon.ico",
          "robots.txt",
          "apple-touch-icon.png",
        ],
        manifest: {
          name: env.VITE_APP_NAME || "جر منفذ آسيا",
          short_name: env.VITE_APP_SHORT_NAME || "منفذ آسيا",
          description:
            env.VITE_APP_DESC || "متجر إلكتروني حديث للمنتجات والعروض اليومية",
          theme_color: "#69be3c",
          background_color: "#ffffff",
          display: "standalone",
          display_override: ["standalone", "browser"],
          dir: "rtl",
          lang: "ar",
          scope: "/",
          start_url: "/",
          orientation: "portrait-primary",
          categories: ["shopping", "lifestyle", "ecommerce"],
          icons: [
            {
              src: "/icons/pwa-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          shortcuts: [
            {
              name: "العروض",
              short_name: "العروض",
              description: "تصفح أحدث الخصومات",
              url: "/offers",
              icons: [{ src: "/icons/pwa-192.png", sizes: "192x192" }],
            },
            {
              name: "السلة",
              short_name: "سلة",
              description: "متابعة مشترياتك الحالية",
              url: "/cart",
              icons: [{ src: "/icons/pwa-192.png", sizes: "192x192" }],
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,ico}"],
          // Exclude server files from PWA analysis
          globIgnores: ["**/server/**", "**/node_modules/**"],
          runtimeCaching: [
            {
              // Do NOT cache SSE; stream directly
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                url.origin === self.location.origin &&
                url.pathname === "/api/events",
              handler: "NetworkOnly",
              options: { cacheName: "sse-bypass" },
            },
            {
              // Cache static pages for full offline experience
              urlPattern: ({ request }) =>
                request.mode === "navigate" &&
                request.destination === "document",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "pages-cache",
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // Cache pages for 24 hours
                },
              },
            },
            {
              // Products listing endpoints benefit from SWR for fast list load
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                url.origin === self.location.origin &&
                (url.pathname === "/api/products" ||
                  url.pathname.startsWith("/api/products/") ||
                  url.pathname.startsWith("/api/search")),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "products-cache",
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 6, // keep catalog results for 6 hours
                },
              },
            },
            {
              // Marketing/offers endpoints
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                url.origin === self.location.origin &&
                (url.pathname.startsWith("/api/products/offers") ||
                  url.pathname.startsWith("/api/products/catalog")),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "offers-catalog-cache",
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 3,
                },
              },
            },
            {
              // User cart should stay fresh but keep last snapshot for brief offline use
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                url.origin === self.location.origin &&
                url.pathname.startsWith("/api/cart"),
              handler: "NetworkFirst",
              options: {
                cacheName: "cart-cache",
                networkTimeoutSeconds: 4,
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 30,
                },
              },
            },
            {
              // Cache user profile and auth data for offline profile viewing
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                url.origin === self.location.origin &&
                (url.pathname === "/api/auth/me" ||
                  url.pathname.startsWith("/api/users/profile")),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "user-profile-cache",
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 15, // Cache user data for 15 minutes
                },
              },
            },
            {
              // Cache categories and navigation data
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                url.origin === self.location.origin &&
                (url.pathname.startsWith("/api/categories") ||
                  url.pathname.startsWith("/api/brands")),
              handler: "CacheFirst",
              options: {
                cacheName: "navigation-cache",
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 12, // Cache navigation for 12 hours
                },
              },
            },
            {
              // Generic same-origin API GET calls; fallback to network-first
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                url.origin === self.location.origin &&
                url.pathname.startsWith("/api/") &&
                url.pathname !== "/api/events" &&
                !url.pathname.startsWith("/api/cart") &&
                !url.pathname.startsWith("/api/auth/me") &&
                !url.pathname.startsWith("/api/users/profile") &&
                !url.pathname.startsWith("/api/categories") &&
                !url.pathname.startsWith("/api/brands"),
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 8,
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60, // Cache other API responses for 1 hour
                },
                // Do not cache bad responses to avoid Cache.put errors
                fetchOptions: { credentials: "same-origin" },
              },
            },
            {
              // Cache external images and fonts with aggressive caching
              urlPattern: ({ url, request }) =>
                (request.destination === "image" ||
                  request.destination === "font") &&
                !url.origin.startsWith("data:"),
              handler: "CacheFirst",
              options: {
                cacheName: "media-cache",
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // Cache media for 7 days
                },
              },
            },
            {
              // Cache only same-origin images to prevent opaque responses
              urlPattern: ({ url, request }) =>
                request.destination === "image" &&
                url.origin === self.location.origin,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "image-cache",
                cacheableResponse: { statuses: [200] },
                matchOptions: { ignoreSearch: true },
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24, // Cache images for 24 hours
                },
              },
            },
            {
              // Cache CSS and JS files aggressively
              urlPattern: ({ request }) =>
                request.destination === "script" ||
                request.destination === "style",
              handler: "CacheFirst",
              options: {
                cacheName: "static-cache",
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // Cache static assets for 7 days
                },
              },
            },
          ],
          // Take control ASAP on updates
          clientsClaim: true,
          skipWaiting: true,
        },
        // Disable SW in dev to avoid caching stale bundles while debugging
        devOptions: { enabled: false },
      }),
      // Generate a treemap HTML file when VISUALIZE=true is set in environment
      visualizerPlugin,
    ],
    build: {
      // Optimize for performance
      target: "esnext",
      minify: "esbuild",
      cssMinify: true,
      sourcemap: false, // Disable in production for smaller bundles
      // Warn earlier about large chunks and help Rollup split common deps
      chunkSizeWarningLimit: 350,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              const reactChunkPattern = /node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/;
              if (reactChunkPattern.test(id)) return "vendor.react";
              if (
                id.includes("react-router") ||
                id.includes("history") ||
                id.includes("@remix-run")
              )
                return "vendor.router";
              if (id.includes("@tanstack") || id.includes("react-query"))
                return "vendor.tanstack";
              if (id.includes("framer-motion")) return "vendor.motion";
              // Split i18next into separate chunk for better caching
              if (id.includes("i18next")) return "vendor.i18next";
              // Split Zustand into separate chunk
              if (id.includes("zustand")) return "vendor.zustand";
              // Split Lucide icons into separate chunk (large library)
              if (id.includes("lucide-react")) return "vendor.icons";
              // Split payment libraries into separate chunks
              if (id.includes("@stripe")) return "vendor.stripe";
              if (id.includes("@paypal")) return "vendor.paypal";
              // Split Twilio into separate chunk
              if (id.includes("twilio")) return "vendor.twilio";
              // Split Zod into separate chunk
              if (id.includes("zod")) return "vendor.zod";
              // Split Sharp into separate chunk
              if (id.includes("sharp")) return "vendor.sharp";
              // Split Leaflet into separate chunk (maps)
              if (id.includes("leaflet")) return "vendor.maps";
              // Split Swiper into separate chunk
              if (id.includes("swiper")) return "vendor.swiper";
              // Split Hook Form into separate chunk
              if (id.includes("@hookform") || id.includes("react-hook-form"))
                return "vendor.forms";
              // Split Toastify into separate chunk
              if (id.includes("react-toastify")) return "vendor.notifications";
              // Fonts chunk
              if (
                id.includes("@fontsource") ||
                id.includes("@font-face") ||
                id.includes("fontsource")
              )
                return "vendor.fonts";
              // Lodash chunk
              if (id.includes("lodash")) return "vendor.lodash";
              return "vendor";
            }

            // Split large feature areas into separate chunks
            if (
              id.includes("/src/pages/admin/") ||
              id.includes("/src/components/admin/")
            ) {
              return "chunk.admin";
            }
            if (
              id.includes("/src/pages/delivery/") ||
              id.includes("/src/components/delivery/") ||
              id.includes("/src/pages/orders/")
            ) {
              return "chunk.delivery";
            }
            if (
              id.includes("/src/pages/seller/") ||
              id.includes("/src/components/seller/")
            ) {
              return "chunk.seller";
            }
            if (
              id.includes("/src/pages/auth/") ||
              id.includes("/src/components/auth/")
            ) {
              return "chunk.auth";
            }
            if (
              id.includes("/src/pages/account/") ||
              id.includes("/src/components/account/")
            ) {
              return "chunk.account";
            }
            if (id.includes("/src/context/") || id.includes("/src/hooks/")) {
              return "chunk.context";
            }
            if (
              id.includes("/src/components/shared/") ||
              id.includes("/src/components/ui/")
            ) {
              return "chunk.shared";
            }
            if (
              id.includes("/src/components/home/") ||
              id.includes("/src/pages/Home") ||
              id.includes("/src/pages/Catalog")
            ) {
              return "chunk.home";
            }
            if (
              id.includes("/src/components/inventory/") ||
              id.includes("/src/pages/inventory/")
            ) {
              return "chunk.inventory";
            }
            if (
              id.includes("/src/components/search/") ||
              id.includes("/src/pages/Search")
            ) {
              return "chunk.search";
            }
            if (
              id.includes("/src/components/cart/") ||
              id.includes("/src/pages/Cart") ||
              id.includes("/src/pages/Checkout")
            ) {
              return "chunk.cart";
            }
            if (
              id.includes("/src/components/marketing/") ||
              id.includes("/src/pages/Offers") ||
              id.includes("/src/pages/Ads")
            ) {
              return "chunk.marketing";
            }
            if (id.includes("/src/services/") || id.includes("/src/api/")) {
              return "chunk.services";
            }
            if (id.includes("/src/utils/") || id.includes("/src/lib/")) {
              return "chunk.utils";
            }
          },
        },
      },
      // Add a small hook to emit a treemap when VISUALIZE=true is set
      rollupOptionsHook: undefined,
    },
    css: {
      postcss: "./postcss.config.cjs",
    },
    server: {
      port: 5173,
      // Allow auto-increment if 5173 is busy to avoid dev startup failures
      strictPort: false,
      open: true,
      // Expose dev server on LAN for testing on real devices
      host: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          // Enable WS upgrades if backend enables WebSocket on /api/events behind the same path
          ws: true,
          // Improve Server-Sent Events stability: keep connection alive and avoid timeouts
          proxyTimeout: 0,
          timeout: 0,
          configure: (proxy) => {
            try {
              console.log(`[vite] Proxying /api -> ${proxyTarget}`);
            } catch {}
            proxy.on("proxyReq", (proxyReq, req) => {
              // Hint keep-alive for SSE; Vite's http-proxy uses Node http(s)
              proxyReq.setHeader("Connection", "keep-alive");
              // Ensure Accept header allows text/event-stream for EventSource
              const accepts = req.headers["accept"] || "";
              if (accepts && !/text\/event-stream/.test(accepts)) {
                try {
                  proxyReq.setHeader("Accept", accepts + ", text/event-stream");
                } catch {}
              }
              // DEV auth headers: simulate a user for local development (server allows in non-production)
              if (devHeadersEnabled) {
                try {
                  if (!req.headers["authorization"]) {
                    proxyReq.setHeader(
                      "x-user-id",
                      req.headers["x-user-id"] || devUserId
                    );
                    proxyReq.setHeader(
                      "x-user-role",
                      req.headers["x-user-role"] || devUserRole
                    );
                  }
                } catch {}
              }
            });
            // Optional: surface proxy errors to vite console for visibility
            proxy.on("error", (err) => {
              console.warn("[vite-proxy] /api error:", err?.message || err);
            });
          },
        },
        "/uploads": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/api/uploads": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});

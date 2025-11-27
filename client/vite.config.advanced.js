import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment-based configuration
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const isProd = env.NODE_ENV === "production";
const isDev = env.NODE_ENV === "development";

// Bundle debugging flags
const enableBundleDebug = env.VITE_DEBUG_BUNDLES === "1" || env.DEBUG_BUNDLES === "1";

export default defineConfig({
  plugins: [
    react({
      // Fast refresh in development
      fastRefresh: !isProd,
      // Optimize React imports
      jsxImportSource: "@emotion/react",
    }),
    // PWA with optimized caching
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
        description: env.VITE_APP_DESC || "متجر إلكتروني حديث للمنتجات والعروض اليومية",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3b82f6",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      // Optimized workbox configuration
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:woff2|woff|ttf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
              },
            },
          },
        ],
      },
    }),
    // Bundle analyzer (only in development or when VISUALIZE=true)
    ...(env.VISUALIZE === "true" || isDev
      ? [
          visualizer({
            filename: "dist/stats.html",
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  
  // Build optimizations
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: enableBundleDebug ? "hidden" : false,
    
    // Stricter chunk size limits for better performance
    chunkSizeWarningLimit: 150,
    reportCompressedSize: false,
    
    // Advanced chunk splitting
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 10000,
        
        // Aggressive manual chunking
        manualChunks: enableBundleDebug ? undefined : function (id) {
          // Node modules splitting
          if (id.includes("node_modules")) {
            // React core
            if (/node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/.test(id)) {
              return "vendor.react";
            }
            
            // Router
            if (id.includes("react-router") || id.includes("history") || id.includes("@remix-run")) {
              return "vendor.router";
            }
            
            // State management
            if (id.includes("@tanstack") || id.includes("react-query")) {
              return "vendor.tanstack";
            }
            if (id.includes("zustand")) {
              return "vendor.zustand";
            }
            
            // UI libraries
            if (id.includes("framer-motion")) return "vendor.motion";
            if (id.includes("lucide-react")) return "vendor.icons";
            if (id.includes("@headlessui")) return "vendor.headless";
            if (id.includes("@radix-ui")) return "vendor.radix";
            
            // Forms
            if (id.includes("@hookform") || id.includes("react-hook-form")) {
              return "vendor.forms";
            }
            
            // Payments
            if (id.includes("@stripe")) return "vendor.stripe";
            if (id.includes("@paypal")) return "vendor.paypal";
            
            // Maps & location
            if (id.includes("leaflet")) return "vendor.maps";
            
            // Charts & analytics
            if (id.includes("recharts") || id.includes("chart.js")) {
              return "vendor.charts";
            }
            
            // Internationalization
            if (id.includes("i18next")) return "vendor.i18next";
            
            // Validation
            if (id.includes("zod")) return "vendor.zod";
            
            // Utilities
            if (id.includes("lodash")) return "vendor.lodash";
            if (id.includes("date-fns") || id.includes("dayjs")) {
              return "vendor.dates";
            }
            
            // Fonts
            if (id.includes("@fontsource") || id.includes("fontsource")) {
              return "vendor.fonts";
            }
            
            // Image processing
            if (id.includes("sharp")) return "vendor.images";
            
            // PDF generation
            if (id.includes("jspdf") || id.includes("pdfkit")) {
              return "vendor.pdf";
            }
            
            // Default vendor chunk
            return "vendor";
          }
          
          // Admin feature splitting (aggressive)
          if (id.includes("/src/pages/admin/") || id.includes("/src/components/admin/")) {
            if (id.includes("dashboard")) return "chunk.admin.dashboard";
            if (id.includes("products")) return "chunk.admin.products";
            if (id.includes("orders")) return "chunk.admin.orders";
            if (id.includes("users") || id.includes("customers")) return "chunk.admin.users";
            if (id.includes("reports") || id.includes("analytics")) return "chunk.admin.analytics";
            if (id.includes("settings")) return "chunk.admin.settings";
            if (id.includes("marketing")) return "chunk.admin.marketing";
            return "chunk.admin";
          }
          
          // Feature-based splitting
          if (id.includes("/src/pages/delivery/") || id.includes("/src/components/delivery/")) {
            return "chunk.delivery";
          }
          if (id.includes("/src/pages/seller/") || id.includes("/src/components/seller/")) {
            return "chunk.seller";
          }
          if (id.includes("/src/pages/auth/") || id.includes("/src/components/auth/")) {
            return "chunk.auth";
          }
          if (id.includes("/src/pages/account/") || id.includes("/src/components/account/")) {
            return "chunk.account";
          }
          
          // Component library splitting
          if (id.includes("/src/components/shared/") || id.includes("/src/components/ui/")) {
            return "chunk.components";
          }
          
          // Context and hooks
          if (id.includes("/src/context/") || id.includes("/src/hooks/")) {
            return "chunk.context";
          }
          
          // Utils and services
          if (id.includes("/src/utils/") || id.includes("/src/services/")) {
            return "chunk.utils";
          }
          
          // Pages splitting
          if (id.includes("/src/pages/")) {
            if (id.includes("products")) return "chunk.pages.products";
            if (id.includes("checkout")) return "chunk.pages.checkout";
            if (id.includes("orders")) return "chunk.pages.orders";
            return "chunk.pages";
          }
        },
      },
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "zustand",
        "lucide-react",
      ],
      exclude: [
        "sharp", // Exclude image processing from dev bundle
        "pdfkit", // Exclude PDF generation from dev bundle
      ],
      force: true,
    },
  },
  
  // Development server optimizations
  server: {
    port: Number(env.VITE_DEV_PORT) || 5173,
    host: env.VITE_DEV_HOST || "localhost",
    cors: true,
    open: false, // Don't auto-open to save resources
    
    // Proxy configuration for API
    proxy: {
      "/api": {
        target: env.VITE_PROXY_TARGET || "http://localhost:8831",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  
  // Preview server optimizations
  preview: {
    port: Number(env.VITE_PREVIEW_PORT) || 4173,
    host: env.VITE_PREVIEW_HOST || "localhost",
  },
  
  // Resolve optimizations
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      "@/styles": path.resolve(__dirname, "./src/styles"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  
  // CSS optimizations
  css: {
    devSourcemap: isDev,
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["legacy-js-api"],
      },
    },
    postcss: {
      plugins: [
        // Add PostCSS optimizations here if needed
      ],
    },
  },
  
  // Environment variables
  define: {
    global: "globalThis",
    process: { 
      env: {}, 
      exit: () => {} 
    },
    __DEV__: isDev,
    __PROD__: isProd,
  },
  
  // Experimental features for better performance
  experimental: {
    renderBuiltUrl: (filename, { hostType }) => {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    },
  },
});

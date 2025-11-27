/* eslint-disable */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite Configuration Optimized for Performance
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Enable source maps for debugging
    sourcemap: true,
    
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          
          // Feature chunks
          'admin-chunk': [
            './src/pages/admin/AdminDashboardModern',
            './src/pages/admin/ProductsManagement',
            './src/pages/admin/OrdersManagement'
          ],
          
          'public-chunk': [
            './src/pages/public/HomePageModern',
            './src/pages/public/ProductList',
            './src/pages/public/ProductDetails'
          ],
          
          'shared-chunk': [
            './src/components/shared/ProductCard/ProductCardModern',
            './src/components/shared/Hero/HeroModern',
            './src/components/shared/SearchBar/SearchBarModern'
          ]
        },
        
        // Asset naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    
    // Target modern browsers
    target: 'es2020',
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  
  // Development server optimizations
  server: {
    port: 3000,
    host: true,
    
    // Enable HMR
    hmr: {
      overlay: true
    },
    
    // Proxy for API requests
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Preview server optimizations
  preview: {
    port: 4173,
    host: true
  },
  
  // Dependency optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react'
    ],
    
    exclude: [
      // Exclude large dependencies from pre-bundling
      'react-chartjs-2',
      'chart.js',
      'leaflet',
      'react-quill'
    ]
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@contexts': resolve(__dirname, 'src/contexts'),
      '@services': resolve(__dirname, 'src/services')
    }
  },
  
  // CSS optimizations
  css: {
    // Enable CSS modules
    modules: {
      localsConvention: 'camelCase'
    },
    
    // PostCSS configuration
    postcss: {
      plugins: [
        // Autoprefixer for browser compatibility
        'autoprefixer',
        
        // CSS nano for minification
        'cssnano'
      ]
    },
    
    // Enable CSS dev sourcemaps
    devSourcemap: true
  },
  
  // Environment variables
  define: {
    // Enable process.env access
    'process.env': 'process.env'
  },
  
  // Experimental features
  experimental: {
    // Enable build optimizations
    renderBuiltUrl: (filename, { hostType }) => {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    }
  },
  
  // Preload strategies
  preload: {
    // Preload critical chunks
    chunks: ['react-vendor', 'router-vendor']
  },
  
  // Performance monitoring
  esbuild: {
    // Drop console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  },
  
  // ESLint configuration
  eslintConfig: {
    globals: {
      process: 'readonly'
    }
  }
});

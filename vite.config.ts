
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { splitVendorChunkPlugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["3923f859-5de7-429d-b09a-7e8f16b14485.lovableproject.com", "localhost"],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    splitVendorChunkPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable sourcemaps for debugging
    sourcemap: mode === 'development',
    // Improve chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Optimize CSS
    cssCodeSplit: true,
    // Use modulepreload polyfill
    modulePreload: {
      polyfill: true,
    },
    // Improve SSR build
    target: 'esnext',
    // Optimize dependencies
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Create separate chunks for different parts of the application
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
            if (id.includes('@tanstack') || id.includes('@supabase')) {
              return 'vendor-data';
            }
            if (id.includes('react') || id.includes('react-router')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
          if (id.includes('/components/')) {
            if (id.includes('/ui/')) {
              return 'ui-components';
            }
            return 'components';
          }
          if (id.includes('/pages/')) {
            return 'pages';
          }
        }
      }
    },
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    terserPath: require.resolve('terser'),
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react'
    ],
    // Force the optimizer to also process listed dependencies
    force: true,
  }
}));

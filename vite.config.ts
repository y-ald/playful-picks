
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
        manualChunks: {
          // Split vendors into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui', 'lucide-react', 'framer-motion'],
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js']
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
  },
  // Server-side rendering options
  ssr: {
    // Add necessary optimizations for SSR
    noExternal: ['react-router-dom', '@supabase/supabase-js'],
    // Include CSS for SSR
    format: 'cjs',
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
    // Exclude problematic packages
    exclude: [],
    // Force the optimizer to also process listed dependencies
    force: true,
  }
}));

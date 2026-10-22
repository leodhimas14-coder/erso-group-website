import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  // The demo build is a single self-contained page, so it skips the service worker.
  plugins: [
    react(),
    mode !== 'demo' && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'img/*'],
      manifest: {
        name: 'ERSO Market',
        short_name: 'ERSO',
        description: 'Makina, motorra, pajisje dhe makineri direkt nga fabrikat në Kinë.',
        lang: 'sq',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0e0f12',
        theme_color: '#0e0f12',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/products') || url.pathname === '/api/config',
            handler: 'NetworkFirst',
            options: { cacheName: 'catalog', expiration: { maxEntries: 100, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 300, maxAgeSeconds: 7 * 86400 } },
          },
        ],
      },
    }),
  ],
  base: mode === 'demo' ? './' : '/',
  build: mode === 'demo' ? { outDir: 'dist-demo', assetsInlineLimit: 100000000, cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } } : undefined,
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
}));

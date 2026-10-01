import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The app shows its own "update available" toast (see PwaUpdatePrompt).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['images/favicon.ico', 'images/apple-touch-icon.png', 'theme-init.js'],
      manifest: {
        id: '/',
        name: 'Famli',
        short_name: 'Famli',
        description: 'Keep every household, address and birthday in one place.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f7f4ef',
        theme_color: '#f7f4ef',
        categories: ['lifestyle', 'productivity'],
        icons: [
          { src: '/images/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/images/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/images/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Households', url: '/', icons: [{ src: '/images/android-chrome-192x192.png', sizes: '192x192' }] },
          { name: 'People', url: '/people', icons: [{ src: '/images/android-chrome-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // App shell only. API responses contain personal data and are never
        // cached by the service worker.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: [
          'images/famli-*.jpg',
          'images/*512x512.png',
          // Non-Latin font subsets are fetched (and cached) only if a page needs them.
          'assets/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'famli-assets', expiration: { maxEntries: 30 } },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api(\/|$)/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Keep the original Host header so the backend's same-origin checks pass.
      '/api': { target: 'http://localhost:3000', changeOrigin: false },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

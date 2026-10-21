import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MandiMitra — सही भाव, बेहतर फैसला',
        short_name: 'MandiMitra',
        description: 'रिपोर्टेड मंडी भाव, सही तारीख और साफ़ तुलना',
        theme_color: '#174b37',
        background_color: '#fbfaf4',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'hi',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.method === 'GET' &&
              /^\/api\/v1\/(states|districts|commodities|prices|trends|markets\/(compare|nearby))$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mandimitra-verified-public-api-v1',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ],
  server: { port: 5173, strictPort: true },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node'
  }
})


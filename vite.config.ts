/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const PWA_THEME_COLOR = '#0a0e1a'
const PWA_BACKGROUND_COLOR = '#0a0e1a'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'type-beats',
        short_name: 'type-beats',
        description: 'QWERTY chiptune studio — personal piano app for study breaks',
        theme_color: PWA_THEME_COLOR,
        background_color: PWA_BACKGROUND_COLOR,
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      devOptions: {
        enabled: false, // SW solo en build, no en dev (interfiere con HMR)
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', './e2e/**'],
  },
})

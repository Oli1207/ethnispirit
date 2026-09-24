import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Dev : VITE_PROXY_TARGET=https://backend.ethnispirit.com (avec VITE_API_URL=/) permet de
// tester le front local sur les vraies données de production, sans blocage CORS.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType:  'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'EthniSpirit — Mode & Bio Caribéens',
        short_name: 'EthniSpirit',
        description: 'Mode caribéenne authentique & cosmétiques bio naturels. Bijoux, vêtements, soins — livraison en Martinique, Guadeloupe et DOM-TOM.',
        theme_color: '#7b3225',
        background_color: '#faf7f2',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        categories: ['shopping', 'lifestyle'],
        shortcuts: [
          {
            name: 'Mode Caribéenne',
            url: '/catalogue',
            description: 'Bijoux, vêtements et accessoires caribéens',
          },
          {
            name: 'Bio & Naturel',
            url: '/bio',
            description: 'Cosmétiques et soins naturels',
          },
        ],
      },
      strategies: 'injectManifest',
      srcDir:     'src',
      filename:   'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: false, // désactivé en dev pour éviter les conflits HMR
        type:    'module',
      },
    }),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: PROXY_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/media': {
        target: PROXY_TARGET,
        secure: true,
        changeOrigin: true,
      },
    },
  },
});

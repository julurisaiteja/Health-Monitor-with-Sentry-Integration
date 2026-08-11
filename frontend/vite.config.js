import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Sentry Vite Plugin - uploads source maps during build
    // Only active when SENTRY_AUTH_TOKEN is set
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: process.env.VITE_SENTRY_RELEASE || 'health-monitor-frontend@1.1.1',
        inject: true,
        create: true,
        finalize: true,
        uploadLegacySourcemaps: {
          path: './dist',
          rewrite: true,
        },
      },
      // Disable in dev mode
      disable: !process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    }),
  ],
  // Generate source maps for production build
  build: {
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

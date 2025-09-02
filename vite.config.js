import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/auth/callback': {
        target: 'https://simplu.io',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace('/auth/callback', '/auth/callback')
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        worker: path.resolve(__dirname, 'public/websocket-worker.js'),
      },
    },
  },
})

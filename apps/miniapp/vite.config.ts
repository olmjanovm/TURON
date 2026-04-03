import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../../',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@turon/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url))
    }
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
  }
})



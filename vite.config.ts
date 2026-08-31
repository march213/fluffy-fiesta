import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import path from 'path'

import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
  },
  plugins: [react(), glsl(), TanStackRouterVite()],
  resolve: {
    alias: {
      '@/routes': path.resolve(__dirname, 'src/routes'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/stores': path.resolve(__dirname, 'src/stores'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/tsl': path.resolve(__dirname, 'src/tsl'),
      '@/sketches': path.resolve(__dirname, 'src/sketches'),
    },
  },
})

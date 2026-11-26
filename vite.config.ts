import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        access: resolve(import.meta.dirname, 'access.html'),
        request: resolve(import.meta.dirname, 'request.html'),
        purchase: resolve(import.meta.dirname, 'purchase.html'),
      },
    },
  },
})

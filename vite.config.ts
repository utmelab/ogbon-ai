import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        access: resolve(__dirname, 'access.html'),
        request: resolve(__dirname, 'request.html'),
        purchase: resolve(__dirname, 'purchase.html'),
      },
    },
  },
})

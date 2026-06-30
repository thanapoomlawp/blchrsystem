import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),          // เดิม
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)) // ใหม่
    }
  },
  plugins: [react()]
})
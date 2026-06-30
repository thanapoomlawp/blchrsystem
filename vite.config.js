// vite.config.js
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  /* ---------- ➊ เพิ่มตรงนี้ ---------- */
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)) //  @  →  /src
    }
  },
  /* ------------------------------------ */
  plugins: [react()]
})
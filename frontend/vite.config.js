import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Forcer IPv4 pour éviter les soucis ::1
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

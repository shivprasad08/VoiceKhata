import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://api:8000', // Points to the Docker service name internally
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://api:8000',
        ws: true,
      }
    }
  }
})

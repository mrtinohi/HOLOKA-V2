import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
    proxy: { '/api': 'http://localhost:8081', '/actuator': 'http://localhost:8081' }
  },
  preview: {
    host: true,
    allowedHosts: true,
    proxy: { '/api': 'http://localhost:8081', '/actuator': 'http://localhost:8081' }
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})

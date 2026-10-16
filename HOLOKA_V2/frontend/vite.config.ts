import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:8080', '/actuator': 'http://localhost:8080' } },
  preview: { proxy: { '/api': 'http://localhost:8080' } },
  plugins: [
    react(),
    tailwindcss(),
  ],
})

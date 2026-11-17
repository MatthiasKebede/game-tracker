import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls from the dev server (port 5173) to Spring Boot (port 8080).
    // The browser only ever talks to one origin, so the backend needs no CORS setup.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    // jsdom provides a browser-like DOM so components can render in tests.
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})

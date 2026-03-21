import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Use jsdom to simulate a browser environment for React Testing Library
    environment: 'jsdom',
    // Import jest-dom matchers globally (e.g. toBeInTheDocument)
    setupFiles: ['./src/setupTests.js'],
    // Allow vitest globals (describe, it, expect) without importing them
    globals: true,
    // Exclude node_modules from coverage
    coverage: {
      exclude: ['node_modules/', 'src/main.jsx'],
    },
  },
})


import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    // Limit dependency scan to the main app entry only
    entries: ['index.html']
  },
  build: {
    rollupOptions: {
      // Ensure only the main SPA is treated as an entry
      input: 'index.html'
    }
  }
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local development Vite serves the React app on port 5173 and proxies
// API and OAuth requests to the Express server on port 3000, so cookies behave
// exactly as they do in the deployed single-origin build.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/auth': { target: 'http://localhost:3000', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist'
  }
});

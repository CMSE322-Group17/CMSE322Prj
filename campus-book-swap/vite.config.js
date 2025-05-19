import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  const apiUrl = env.VITE_API_URL || 'http://localhost:1337';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Proxy /api requests to your Strapi backend
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Proxy WebSocket connections
        '/socket.io': {
          target: apiUrl.replace('http', 'ws'),
          ws: true,
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      // Make env variables available at build time
      'process.env': env
    },
    optimizeDeps: {
      exclude: ['@tailwindcss/vite']
    }
  }
})

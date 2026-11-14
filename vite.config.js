import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const htdocsFolder = path.basename(__dirname)

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Proxy API requests in local development (:5173) to XAMPP Apache (:80)
      // Automatically maps to the active htdocs folder (e.g., /citypet-commerce/api)
      '/citypet/api': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
        secure: false,
        rewrite: (reqPath) => reqPath.replace(/^\/citypet\/api/, `/${htdocsFolder}/api`),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[proxy error]', err.message)
          })
        },
      },
      '/api': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
        secure: false,
        rewrite: (reqPath) => reqPath.replace(/^\/api/, `/${htdocsFolder}/api`),
      },
    },
  },
})

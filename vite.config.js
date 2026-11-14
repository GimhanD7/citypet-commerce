import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Proxy all /citypet/api/* requests to XAMPP Apache on port 80
      // This avoids ERR_CONNECTION_REFUSED caused by cross-origin fetch from :5173 → :80
      '/citypet/api': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
        secure: false,
        // Optional: log proxy hits in terminal for debugging
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[proxy error]', err.message)
          })
        },
      },
    },
  },
})

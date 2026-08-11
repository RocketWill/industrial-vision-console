import { defineConfig } from 'vite'
import pkg from "./package.json";
import path from 'path'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,   // 等同於 0.0.0.0
    port: 5173,
    allowedHosts: [
      "*"
    ],
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        headers: {
          "ngrok-skip-browser-warning": "true",
        }
      },
      "/token": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        headers: {
          "ngrok-skip-browser-warning": "true",
        }
      },
      "/data": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      }
    },
  },
})

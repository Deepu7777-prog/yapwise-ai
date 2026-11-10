import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'yapwise-ai-7.onrender.com',
      '.onrender.com',
      '.vercel.app',
      '.trycloudflare.com',
      'localhost',
      '127.0.0.1',
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'yapwise-ai-7.onrender.com',
      '.onrender.com',
      '.vercel.app',
      '.trycloudflare.com',
      'localhost',
      '127.0.0.1',
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});

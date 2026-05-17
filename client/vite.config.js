import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2020', 'safari14', 'chrome87', 'firefox78'],
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom'],
          'router':        ['react-router-dom'],
          'redux':         ['@reduxjs/toolkit', 'react-redux'],
          'query':         ['react-query'],
          'axios':         ['axios'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
});
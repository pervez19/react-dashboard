import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks cache well across app deploys.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          state: ['@reduxjs/toolkit', 'react-redux', 'axios'],
        },
      },
    },
  },
});

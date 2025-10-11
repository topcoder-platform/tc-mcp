import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig(() => {

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['your-ngrok-static-url-frontend.app'],
    },
    base: '/teamsTab/', // Vite will generate assets with this base path
    envDir: '../',
    build: {
      outDir: resolve(__dirname, 'dist'),
    },
  };
});

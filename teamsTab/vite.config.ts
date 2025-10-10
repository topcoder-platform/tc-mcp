import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig(() => {

  return {
  plugins: [react()],
  server: {
    allowedHosts: ["diamondlike-crosstied-yuette.ngrok-free.app"],
  },
  base: '/teamsTab/', // Vite will generate assets with this base path
  build: {
    outDir: resolve(__dirname, 'dist'),
  },
};
});

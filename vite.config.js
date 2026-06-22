import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    port: 5173,
    allowedHosts: true,
  },
  build: {
    target: 'esnext',
  },
});

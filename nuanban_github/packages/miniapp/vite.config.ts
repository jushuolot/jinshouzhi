import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

const base = process.env.VITE_BASE || '/';
const buildTime = new Date().toISOString();

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
  },
  plugins: [uni()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
});

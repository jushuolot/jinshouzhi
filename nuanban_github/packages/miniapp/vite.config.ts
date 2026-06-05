import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
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

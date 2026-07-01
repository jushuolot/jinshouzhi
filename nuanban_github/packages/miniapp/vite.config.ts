import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import { devVerificationPhotoPlugin } from './vite-plugins/dev-verification-photo';
import { eliminateLegacyLoginPlugin } from './vite-plugins/eliminate-legacy-login';
import { variantPagesJsonPlugin } from './vite-plugins/variant-pages-json';

const base = process.env.VITE_BASE || '/';
const buildTime = new Date().toISOString();
const devPort = Number(process.env.UNI_H5_PORT || process.env.PORT || 5174);
const appVariant =
  process.env.VITE_APP_VARIANT ||
  (devPort === 5175 ? 'control' : devPort === 5174 ? 'user' : 'unified');

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    'import.meta.env.VITE_APP_VARIANT': JSON.stringify(appVariant),
  },
  plugins: [variantPagesJsonPlugin(devPort), uni(), eliminateLegacyLoginPlugin(), devVerificationPhotoPlugin()],
  server: {
    host: '0.0.0.0',
    port: devPort,
    strictPort: true,
    // 手机局域网 / loca.lt 隧道访问 dev
    allowedHosts: true,
    watch: {
      // 双端并行 dev 时，禁止另一进程改写 pages.json 触发热更新
      ignored: ['**/src/pages.json'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
});

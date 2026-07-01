import { copyFileSync, existsSync, readFileSync } from 'fs';
import { join, normalize } from 'path';
import type { Plugin, ViteDevServer } from 'vite';

const PAGES_JSON_JS = 'pages-json-js';

function resolveVariant(devPort: number): string {
  const fromEnv = process.env.VITE_APP_VARIANT;
  if (fromEnv === 'user' || fromEnv === 'control' || fromEnv === 'unified') return fromEnv;
  if (devPort === 5175) return 'control';
  if (devPort === 5174) return 'user';
  return 'unified';
}

function isPagesJsonJsId(id: string): boolean {
  const norm = normalize(id);
  return norm.endsWith(PAGES_JSON_JS) || norm.endsWith(`${PAGES_JSON_JS}.js`);
}

/**
 * V2 双端并行 dev：各进程从 pages.{variant}.json 提供路由，不再反复写入共享 pages.json。
 * uni 的 pages-json-js 在 dev 下由 load 拦截；build 仍同步 pages.json 供 CLI 读盘。
 */
export function variantPagesJsonPlugin(devPort = 5174): Plugin {
  const srcDir = join(__dirname, '../src');
  const variant = resolveVariant(devPort);
  const variantPath = join(srcDir, `pages.${variant}.json`);
  const pagesPath = join(srcDir, 'pages.json');
  const pagesJsonJsPath = join(srcDir, PAGES_JSON_JS);

  let isServe = false;

  const readVariantContent = (): string | null => {
    if (!existsSync(variantPath)) {
      console.warn(`[variant-pages-json] missing ${variantPath}, skip`);
      return null;
    }
    return readFileSync(variantPath, 'utf8');
  };

  const syncPagesJson = () => {
    const content = readVariantContent();
    if (content) copyFileSync(variantPath, pagesPath);
  };

  const invalidatePagesJsonJs = (server: ViteDevServer) => {
    const mod =
      server.moduleGraph.getModuleById(pagesJsonJsPath) ||
      server.moduleGraph.getModuleById(`/${PAGES_JSON_JS}`) ||
      server.moduleGraph.getModuleById(`/src/${PAGES_JSON_JS}`);
    if (mod) {
      server.moduleGraph.invalidateModule(mod);
      server.ws.send({ type: 'full-reload', path: '*' });
    }
  };

  return {
    name: 'variant-pages-json',
    enforce: 'pre',
    config(_config, { command }) {
      isServe = command === 'serve';
      // 供 parsePagesJsonOnce 等启动时读盘；dev 下后续不再改写，避免双端互踩
      syncPagesJson();
    },
    load(id) {
      if (!isServe || !isPagesJsonJsId(id)) return;
      return readVariantContent() ?? undefined;
    },
    configureServer(server) {
      server.watcher.add(variantPath);
      server.watcher.on('change', (file) => {
        if (file !== variantPath) return;
        if (!isServe) syncPagesJson();
        invalidatePagesJsonJs(server);
      });
    },
    buildStart() {
      if (!isServe) syncPagesJson();
    },
  };
}

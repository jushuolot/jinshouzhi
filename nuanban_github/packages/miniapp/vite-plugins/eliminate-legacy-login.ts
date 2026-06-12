import type { Connect } from 'vite';
import type { Plugin } from 'vite';

const LEGACY_LOGIN = /^\/login\/?$/;

function loginHashUrl(reqUrl: string | undefined): string {
  const raw = (reqUrl || '/').split('?')[0];
  const base = raw.replace(LEGACY_LOGIN, '').replace(/\/$/, '') || '';
  return `${base}/#/pages/common/login`;
}

function redirectLegacyLogin(req: Connect.IncomingMessage, res: Connect.ServerResponse, next: Connect.NextFunction) {
  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    next();
    return;
  }
  const path = (req.url || '/').split('?')[0];
  if (!LEGACY_LOGIN.test(path)) {
    next();
    return;
  }
  const target = loginHashUrl(path);
  res.writeHead(301, { Location: target, 'Cache-Control': 'no-store' });
  res.end();
}

/** 废弃 /login 物理路径：开发/预览 301 到 hash 登录页 */
export function eliminateLegacyLoginPlugin(): Plugin {
  return {
    name: 'eliminate-legacy-login',
    configureServer(server) {
      return () => {
        server.middlewares.use(redirectLegacyLogin);
      };
    },
    configurePreviewServer(server) {
      return () => {
        server.middlewares.use(redirectLegacyLogin);
      };
    },
  };
}

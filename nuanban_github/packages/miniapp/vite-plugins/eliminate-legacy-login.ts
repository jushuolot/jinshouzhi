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

/** Prepend middleware so /login is handled before SPA history fallback. */
function prependMiddleware(
  stack: Array<{ route: string; handle: Connect.NextHandleFunction }>,
  middleware: Connect.NextHandleFunction,
) {
  stack.unshift({ route: '', handle: middleware });
}

/** 废弃 /login 物理路径：开发/预览 301 到 hash 登录页 */
export function eliminateLegacyLoginPlugin(): Plugin {
  const install = (middlewares: Connect.Server) => {
    prependMiddleware(middlewares.stack, redirectLegacyLogin);
  };
  return {
    name: 'eliminate-legacy-login',
    configureServer(server) {
      return () => install(server.middlewares);
    },
    configurePreviewServer(server) {
      return () => install(server.middlewares);
    },
  };
}

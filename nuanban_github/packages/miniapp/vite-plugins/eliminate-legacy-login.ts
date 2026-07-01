import type { Connect } from 'vite';
import type { Plugin } from 'vite';

/** 旧项目遗留的 /login 物理路径（非暖伴 hash 路由） */
const LEGACY_LOGIN = /^\/login(\/.*)?$/;

function loginHashUrl(reqUrl: string | undefined): string {
  const q = (reqUrl || '').includes('?') ? (reqUrl || '').slice((reqUrl || '').indexOf('?')) : '';
  return `/#/login${q}`;
}

function redirectLegacyLogin(
  req: Connect.IncomingMessage,
  res: Connect.ServerResponse,
  next: Connect.NextFunction,
) {
  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    next();
    return;
  }
  const path = (req.url || '/').split('?')[0];
  if (!LEGACY_LOGIN.test(path)) {
    next();
    return;
  }
  const target = loginHashUrl(req.url);
  const body = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${target}">
<meta name="robots" content="noindex">
<title>暖伴勤工 · 跳转登录</title>
<script>location.replace(${JSON.stringify(target)});</script>
</head><body><p>已离开旧版 /login 路径，正在进入 <a href="${target}">暖伴勤工登录</a>…</p></body></html>`;
  res.writeHead(302, {
    Location: target,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
  });
  res.end(body);
}

function prependMiddleware(
  stack: Array<{ route: string; handle: Connect.NextHandleFunction }>,
  middleware: Connect.NextHandleFunction,
) {
  stack.unshift({ route: '', handle: middleware });
}

/** 废弃 /login 物理路径：开发/预览强制跳转暖伴 hash 登录页 */
export function eliminateLegacyLoginPlugin(): Plugin {
  const install = (middlewares: Connect.Server) => {
    prependMiddleware(middlewares.stack, redirectLegacyLogin);
  };
  return {
    name: 'eliminate-legacy-login',
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
}

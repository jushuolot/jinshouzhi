/** GitHub Pages 等 HTTPS 站点使用的远程 API（须为 HTTPS，避免 mixed-content） */
export const NUANBAN_HTTPS_API_HOST = 'user.nuanbao.cc';

export const NUANBAN_HTTPS_API_BASE = `https://${NUANBAN_HTTPS_API_HOST}/api`;

/** 备案后正式 H5 入口（V2 用户端） */
export const NUANBAN_STAGING_H5_ORIGIN = 'https://user.nuanbao.cc';

/** V2 运营台入口 */
export const NUANBAN_CONTROL_H5_ORIGIN = 'https://control.nuanbao.cc';

export function stagingH5Url(hashPath: string): string {
  const path = hashPath.startsWith('#') ? hashPath : `#${hashPath.startsWith('/') ? '' : '/'}${hashPath}`;
  return `${NUANBAN_STAGING_H5_ORIGIN}/${path}`;
}

export function isGithubPagesHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.github.io');
}

export function isMixedContentApiBlock(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.protocol !== 'https:') return false;
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  return base.startsWith('http://');
}

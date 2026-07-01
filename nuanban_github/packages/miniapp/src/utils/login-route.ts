/** uni-app 内部跳转路径（不可缩短） */
export const LOGIN_PAGE = '/pages/common/login';

/** H5 hash 完整路径 */
export const LOGIN_HASH = '#/pages/common/login';

/** H5 短入口（别名，打开后映射到 LOGIN_HASH） */
export const LOGIN_HASH_SHORT = '#/login';

export function loginPageUrl(query = ''): string {
  const q = query.startsWith('?') ? query : query ? `?${query}` : '';
  return `${LOGIN_PAGE}${q}`;
}

export function loginHashUrl(query = ''): string {
  const q = query.startsWith('?') ? query : query ? `?${query}` : '';
  return `${LOGIN_HASH}${q}`;
}

export function loginHashShortUrl(query = ''): string {
  const q = query.startsWith('?') ? query : query ? `?${query}` : '';
  return `${LOGIN_HASH_SHORT}${q}`;
}

/** H5：#/login → #/pages/common/login */
export function resolveLoginHashAlias(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const m = hash.match(/^#\/login(\?.*)?$/);
  if (!m) return false;
  const q = m[1] || '';
  const target = `${window.location.pathname || '/'}${window.location.search || ''}${LOGIN_HASH}${q}`;
  window.location.replace(target);
  return true;
}

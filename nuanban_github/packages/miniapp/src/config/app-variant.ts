/** V2 应用变体：user 用户端 | control 运营台 | unified 合一包（兼容 V1） */
export type AppVariant = 'user' | 'control' | 'unified';

export const APP_VARIANT = (import.meta.env.VITE_APP_VARIANT || 'unified') as AppVariant;

export function isUserApp(): boolean {
  return APP_VARIANT === 'user';
}

export function isControlApp(): boolean {
  return APP_VARIANT === 'control';
}

export function isUnifiedApp(): boolean {
  return APP_VARIANT === 'unified';
}

/** 用户端不展示运营台入口；运营台始终展示 */
export function showOpsEntry(): boolean {
  return isControlApp() || isUnifiedApp();
}

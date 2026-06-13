/**
 * 虚拟手机号快捷登录：仅本地开发或显式开启。
 * 正式/发布环境登录走真实短信或 PocketBase 演示号 hooks。
 */
export function isVirtualPhoneLoginEnabled(): boolean {
  if (import.meta.env.VITE_VIRTUAL_PHONE_LOGIN === 'true') return true;
  return import.meta.env.DEV === true;
}

import { isDemoMockEnabled } from './demo-mock';

/**
 * 虚拟手机号登录：本地 dev / 演示 mock / 显式 VITE_VIRTUAL_PHONE_LOGIN。
 * 对应 pb_hooks phone-login：演示号验证码可留空，无需真实短信。
 */
export function isVirtualPhoneLoginEnabled(): boolean {
  if (isDemoMockEnabled()) return true;
  if (import.meta.env.VITE_VIRTUAL_PHONE_LOGIN === 'true') return true;
  return import.meta.env.DEV === true;
}

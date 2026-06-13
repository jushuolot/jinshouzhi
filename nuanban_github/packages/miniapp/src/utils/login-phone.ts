/** 从正式登录邮箱提取 11 位手机号 */
export function phoneFromLoginEmail(email?: string | null): string {
  const m = String(email || '').match(/^(\d{11})@/);
  return m ? m[1] : '';
}

export function isValidCnMobile(phone: string): boolean {
  return /^1\d{10}$/.test(phone.trim());
}

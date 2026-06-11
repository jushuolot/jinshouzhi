import type { RoleKey } from '../config/tabs';
import { useRoleStore } from '../store/role';
import { DEMO_USERS } from './demo-rich-data';

const STORAGE_KEY = 'nuanban_guest_browse';
const ROLE_KEY = 'nuanban_guest_role';

export const GUEST_ROLE_LABELS: Record<RoleKey, string> = {
  elder: '老人',
  family: '家属',
  student: '学生',
};

export function enterGuestBrowse(role: RoleKey) {
  try {
    uni.setStorageSync(STORAGE_KEY, true);
    uni.setStorageSync(ROLE_KEY, role);
  } catch {
    /* ignore */
  }
}

export function exitGuestBrowse() {
  try {
    uni.removeStorageSync(STORAGE_KEY);
    uni.removeStorageSync(ROLE_KEY);
  } catch {
    /* ignore */
  }
}

export function isGuestBrowse(): boolean {
  try {
    return uni.getStorageSync(STORAGE_KEY) === true;
  } catch {
    return false;
  }
}

export function guestBrowseRole(): RoleKey | null {
  if (!isGuestBrowse()) return null;
  try {
    const r = uni.getStorageSync(ROLE_KEY);
    if (r === 'elder' || r === 'family' || r === 'student') return r;
  } catch {
    /* ignore */
  }
  return null;
}

export function guestRoleLabel(role?: RoleKey | null): string {
  const r = role ?? guestBrowseRole();
  return r ? GUEST_ROLE_LABELS[r] : '游客';
}

export function guestBannerTitle(): string {
  return `游客模式 · ${guestRoleLabel()}`;
}

/** 游客模拟操作对应的演示账号 ID（不写库） */
export function guestDemoUserId(): string {
  const role = guestBrowseRole() || 'elder';
  if (role === 'student') return DEMO_USERS.student.id;
  if (role === 'family') return DEMO_USERS.family.id;
  return DEMO_USERS.elder.id;
}

export function isGuestPackagePath(path: string, role: RoleKey): boolean {
  return path.includes(`package-${role}`);
}

export function notifyGuestSimulate(message = '演示操作成功，游客数据不会保存') {
  if (!isGuestBrowse()) return;
  uni.showToast({ title: message, icon: 'none', duration: 2200 });
}

export function promptRegisterForOrder() {
  uni.navigateTo({ url: '/pages/common/register?from=guest&reason=order' });
}

export function promptLoginForAction() {
  promptRegisterForOrder();
}

/** 游客模式允许模拟操作；未登录非游客需注册 */
export function requireOperableAuth(): boolean {
  if (isGuestBrowse()) return true;
  const roleStore = useRoleStore();
  if (!roleStore.isLoggedIn) {
    uni.showToast({ title: '注册后才能下单', icon: 'none', duration: 2000 });
    setTimeout(() => promptRegisterForOrder(), 350);
    return false;
  }
  return true;
}

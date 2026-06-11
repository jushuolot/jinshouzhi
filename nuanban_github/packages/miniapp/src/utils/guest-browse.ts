import type { RoleKey } from '../config/tabs';
import { useRoleStore } from '../store/role';

const STORAGE_KEY = 'nuanban_guest_browse';
const ROLE_KEY = 'nuanban_guest_role';

const GUEST_HOME_SUFFIXES = ['/package-elder/home', '/package-family/home', '/package-student/home'];

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

export function isGuestHomePath(path: string): boolean {
  return GUEST_HOME_SUFFIXES.some((suffix) => path.includes(suffix));
}

export function promptLoginForAction() {
  uni.showModal({
    title: '需要登录',
    content: '请先阅读用户手册，登录并完善资料后即可操作',
    confirmText: '去登录',
    cancelText: '继续浏览',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/common/user-manual?next=login' });
      }
    },
  });
}

export function requireOperableAuth(): boolean {
  if (isGuestBrowse()) {
    promptLoginForAction();
    return false;
  }
  const roleStore = useRoleStore();
  if (!roleStore.isLoggedIn) {
    promptLoginForAction();
    return false;
  }
  return true;
}

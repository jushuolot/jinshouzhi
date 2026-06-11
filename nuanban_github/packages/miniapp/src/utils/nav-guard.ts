import type { RoleKey } from '../config/tabs';
import { useRoleStore } from '../store/role';
import { guestBrowseRole, isGuestBrowse } from './guest-browse';
import { resolveUnauthenticatedEntry } from './tour-onboarding';

const PACKAGE_ROLE: Record<string, RoleKey> = {
  'package-elder': 'elder',
  'package-family': 'family',
  'package-student': 'student',
};

export function guardPackageRoute(path: string): boolean {
  const roleStore = useRoleStore();
  if (!roleStore.isLoggedIn) {
    if (isGuestBrowse()) {
      const guestRole = guestBrowseRole();
      const pkg = Object.keys(PACKAGE_ROLE).find((p) => path.includes(p));
      if (!pkg) return true;
      if (guestRole && PACKAGE_ROLE[pkg] === guestRole) return true;
      uni.showToast({ title: '请在本身份演示数据下操作', icon: 'none' });
      return false;
    }
    uni.reLaunch({ url: resolveUnauthenticatedEntry() });
    return false;
  }
  const pkg = Object.keys(PACKAGE_ROLE).find((p) => path.includes(p));
  if (!pkg) return true;
  const need = PACKAGE_ROLE[pkg];
  if (roleStore.activeRole !== need) {
    uni.showToast({ title: '请切换对应身份', icon: 'none' });
    return false;
  }
  if (need === 'student') {
    const st = roleStore.roles.find((r) => r.role === 'student');
    if (st?.status === 'pending') {
      uni.reLaunch({ url: '/pages/common/student-pending' });
      return false;
    }
    if (st?.status !== 'active') {
      uni.showToast({ title: '学生资质审核中', icon: 'none' });
      return false;
    }
  }
  return true;
}

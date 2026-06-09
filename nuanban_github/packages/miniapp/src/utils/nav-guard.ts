import type { RoleKey } from '../config/tabs';
import { useRoleStore } from '../store/role';
import { guardGodViewOrRedirect } from './god-view-auth';

/** 直接访问上帝视角页时校验超级管理员会话 */
export function guardGodViewRoute(path: string): boolean {
  if (!path.includes('god-view') || path.includes('god-view-gate')) return true;
  return guardGodViewOrRedirect();
}

const PACKAGE_ROLE: Record<string, RoleKey> = {
  'package-elder': 'elder',
  'package-family': 'family',
  'package-student': 'student',
};

export function guardPackageRoute(path: string): boolean {
  const roleStore = useRoleStore();
  if (!roleStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/common/login' });
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

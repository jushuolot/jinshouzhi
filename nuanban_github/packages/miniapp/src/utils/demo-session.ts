import type { AuthRole } from '../api/auth';
import type { RoleKey } from '../config/tabs';

const ROLES_KEY = 'roles';

export function readStoredRoles(): AuthRole[] {
  try {
    const raw = uni.getStorageSync(ROLES_KEY);
    return Array.isArray(raw) ? (raw as AuthRole[]) : [];
  } catch {
    return [];
  }
}

/** 演示登录：按已保存身份还原 mock 用户，无身份则返回空角色待注册 */
export function buildDemoLoginFromStoredRoles() {
  const roles = readStoredRoles();
  if (!roles.length) {
    return {
      token: 'demo-token',
      user: { id: 'user-demo', nickname: '暖伴用户', email: 'user@nuanban.dev' },
      roles: [] as AuthRole[],
    };
  }

  const activeRoles = roles.filter((r) => r.status === 'active');
  const primary = activeRoles[0]?.role ?? roles[0].role;
  const profile = roleProfile(primary);

  return {
    token: 'demo-token',
    user: { id: profile.id, nickname: profile.nickname, email: profile.email },
    roles,
    activeRole: activeRoles.length === 1 ? primary : undefined,
  };
}

function roleProfile(role: RoleKey) {
  if (role === 'family') {
    return { id: 'user-family', nickname: '家属用户', email: 'family1@test.nuanban.dev' };
  }
  if (role === 'elder') {
    return { id: 'user-elder', nickname: '老人用户', email: 'elder1@test.nuanban.dev' };
  }
  return { id: 'user-student', nickname: '林同学', email: 'student1@test.nuanban.dev' };
}

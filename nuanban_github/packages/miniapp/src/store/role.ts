import { defineStore } from 'pinia';
import type { RoleKey } from '../config/tabs';
import type { AuthRole } from '../api/auth';

export type UserRole = AuthRole;

const TOKEN_KEY = 'access_token';
const ACTIVE_ROLE_KEY = 'activeRole';
const ROLES_KEY = 'roles';
const ELDER_PROFILE_KEY = 'elderProfileId';
const USER_KEY = 'user';

function readRolesFromStorage(): UserRole[] {
  try {
    const raw = uni.getStorageSync(ROLES_KEY);
    return Array.isArray(raw) ? (raw as UserRole[]) : [];
  } catch {
    return [];
  }
}

export const useRoleStore = defineStore('role', {
  state: () => ({
    token: uni.getStorageSync(TOKEN_KEY) as string,
    activeRole: (uni.getStorageSync(ACTIVE_ROLE_KEY) as RoleKey) || null,
    roles: readRolesFromStorage(),
    elderProfileId: (uni.getStorageSync(ELDER_PROFILE_KEY) as string) || null,
    user: (uni.getStorageSync(USER_KEY) as {
      id: string;
      nickname?: string;
      email?: string;
      avatarUrl?: string;
    }) || null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    activeRoles: (s) => s.roles.filter((r) => r.status === 'active'),
    hasMultipleRoles: (s) => s.roles.filter((r) => r.status === 'active').length > 1,
    currentElderId: (s) => {
      if (s.elderProfileId) return s.elderProfileId;
      const elderRole = s.roles.find((r) => r.role === 'elder' && r.status === 'active');
      return elderRole?.elderProfileId ?? null;
    },
  },
  actions: {
    setAuth(payload: {
      token: string;
      roles: UserRole[];
      activeRole?: RoleKey;
      user?: { id: string; nickname?: string; email?: string; avatarUrl?: string };
    }) {
      this.token = payload.token;
      this.roles = payload.roles;
      this.user = payload.user ?? null;
      const elderRole = payload.roles.find((r) => r.role === 'elder' && r.status === 'active');
      if (elderRole?.elderProfileId) {
        this.elderProfileId = elderRole.elderProfileId;
      } else if (!payload.roles.some((r) => r.role === 'elder')) {
        this.elderProfileId = null;
      }

      const actives = payload.roles.filter((r) => r.status === 'active');
      const roleKeys = new Set(payload.roles.map((r) => r.role));

      if (payload.activeRole && roleKeys.has(payload.activeRole)) {
        this.activeRole = payload.activeRole;
      } else if (actives.length === 1) {
        this.activeRole = actives[0].role;
      } else if (payload.roles.length === 1) {
        this.activeRole = payload.roles[0].role;
      } else if (this.activeRole && !roleKeys.has(this.activeRole)) {
        this.activeRole = null;
      } else if (actives.length > 1) {
        this.activeRole = null;
      }

      uni.setStorageSync(TOKEN_KEY, this.token);
      uni.setStorageSync(ROLES_KEY, this.roles);
      if (this.user) uni.setStorageSync(USER_KEY, this.user);
      if (this.activeRole) {
        uni.setStorageSync(ACTIVE_ROLE_KEY, this.activeRole);
      } else {
        uni.removeStorageSync(ACTIVE_ROLE_KEY);
      }
      if (this.elderProfileId) {
        uni.setStorageSync(ELDER_PROFILE_KEY, this.elderProfileId);
      } else {
        uni.removeStorageSync(ELDER_PROFILE_KEY);
      }
    },
    setActiveRole(role: RoleKey) {
      this.activeRole = role;
      uni.setStorageSync(ACTIVE_ROLE_KEY, role);
      const elderRole = this.roles.find((r) => r.role === 'elder' && r.elderProfileId);
      if (role === 'elder' && elderRole?.elderProfileId) {
        this.elderProfileId = elderRole.elderProfileId;
        uni.setStorageSync(ELDER_PROFILE_KEY, this.elderProfileId);
      }
    },
    setElderProfileId(id: string) {
      this.elderProfileId = id;
      uni.setStorageSync(ELDER_PROFILE_KEY, id);
    },
    setUserAvatar(avatarUrl: string) {
      if (!this.user) return;
      this.user = { ...this.user, avatarUrl };
      uni.setStorageSync(USER_KEY, this.user);
    },
    setUserNickname(nickname: string) {
      if (!this.user) return;
      const name = nickname.trim();
      if (!name) return;
      this.user = { ...this.user, nickname: name };
      uni.setStorageSync(USER_KEY, this.user);
    },
    setStudentRoleStatus(status: string) {
      const idx = this.roles.findIndex((r) => r.role === 'student');
      if (idx < 0) return;
      this.roles = this.roles.map((r, i) =>
        i === idx ? { ...r, status } : r,
      );
      uni.setStorageSync(ROLES_KEY, this.roles);
    },
    logout() {
      this.token = '';
      this.activeRole = null;
      this.roles = [];
      this.user = null;
      this.elderProfileId = null;
      uni.removeStorageSync(TOKEN_KEY);
      uni.removeStorageSync(ACTIVE_ROLE_KEY);
      uni.removeStorageSync(ROLES_KEY);
      uni.removeStorageSync(USER_KEY);
      uni.removeStorageSync(ELDER_PROFILE_KEY);
    },
  },
});

import type { RoleKey } from '../config/tabs';
import { ROLE_HOME } from '../config/tabs';
import { fetchElderSelfProfile } from '../api/elder';
import { fetchFamilyProfile } from '../api/family';
import { fetchStudentProfile } from '../api/student';
import { useRoleStore } from '../store/role';

export const ROLE_PROFILE_EDIT: Record<RoleKey, string> = {
  student: '/package-student/profile/edit',
  family: '/package-family/profile/edit',
  elder: '/package-elder/profile/edit',
};

const STORAGE_PREFIX = 'profile_onboarded_';

function storageKey(userId: string, role: RoleKey) {
  return `${STORAGE_PREFIX}${userId}_${role}`;
}

export function isProfileOnboardedLocal(userId: string, role: RoleKey): boolean {
  try {
    return uni.getStorageSync(storageKey(userId, role)) === true;
  } catch {
    return false;
  }
}

export function markProfileOnboarded(role: RoleKey) {
  const userId = useRoleStore().user?.id;
  if (!userId) return;
  try {
    uni.setStorageSync(storageKey(userId, role), true);
  } catch {
    /* ignore */
  }
}

type ProfilePayload = {
  profileComplete?: boolean;
  displayName?: string;
  schoolName?: string;
  nickname?: string;
  contactPhone?: string;
  district?: string;
  name?: string;
  address?: string;
};

export function computeProfileComplete(role: RoleKey, profile: ProfilePayload): boolean {
  if (profile.profileComplete === true) return true;
  if (profile.profileComplete === false) return false;
  if (role === 'student') {
    return !!(profile.displayName?.trim() && profile.schoolName?.trim());
  }
  if (role === 'family') {
    return !!(profile.nickname?.trim() && profile.contactPhone?.trim() && profile.district?.trim());
  }
  return !!(profile.name?.trim() && profile.district?.trim() && profile.address?.trim());
}

async function fetchProfileForRole(role: RoleKey): Promise<ProfilePayload> {
  if (role === 'student') return fetchStudentProfile();
  if (role === 'family') return fetchFamilyProfile();
  return fetchElderSelfProfile();
}

export async function needsProfileOnboarding(role: RoleKey): Promise<boolean> {
  const roleStore = useRoleStore();
  const userId = roleStore.user?.id;
  if (!userId) return false;

  if (role === 'student') {
    const st = roleStore.roles.find((r) => r.role === 'student');
    if (st?.status === 'pending') return false;
  }

  if (isProfileOnboardedLocal(userId, role)) return false;

  try {
    const profile = await fetchProfileForRole(role);
    if (computeProfileComplete(role, profile)) {
      markProfileOnboarded(role);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function navigateAfterAuth(role: RoleKey) {
  const needs = await needsProfileOnboarding(role);
  if (needs) {
    uni.reLaunch({ url: `${ROLE_PROFILE_EDIT[role]}?onboarding=1` });
    return;
  }
  uni.reLaunch({ url: ROLE_HOME[role] });
}

export function finishProfileOnboarding(role: RoleKey) {
  markProfileOnboarded(role);
  uni.reLaunch({ url: ROLE_HOME[role] });
}

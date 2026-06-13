import type { RoleKey } from '../config/tabs';
import { ROLE_HOME } from '../config/tabs';
import { fetchElderSelfProfile } from '../api/elder';
import { fetchFamilyProfile } from '../api/family';
import { fetchPaymentAccount } from '../api/payment-account';
import { fetchStudentProfile } from '../api/student';
import { useRoleStore } from '../store/role';
import { isKnownSchool } from './known-schools';
import { isStudentAuditProfileComplete } from './student-audit-profile';

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
  paymentAccountConfigured?: boolean;
  displayName?: string;
  schoolName?: string;
  verificationPhotoUrl?: string;
  nickname?: string;
  contactPhone?: string;
  district?: string;
  name?: string;
  address?: string;
  cartoonAvatarId?: string;
  customCartoonAvatarUrl?: string;
  serviceAreaPolygons?: { ring?: { lat: number; lng: number }[] }[];
  serviceHours?: string[];
};

function baseProfileFieldsComplete(role: RoleKey, profile: ProfilePayload): boolean {
  if (profile.profileComplete === false) return false;
  if (role === 'student') {
    return !!(
      profile.displayName?.trim()
      && isKnownSchool(profile.schoolName || '')
      && profile.verificationPhotoUrl
    );
  }
  if (role === 'family') {
    return !!(profile.nickname?.trim() && profile.contactPhone?.trim() && profile.district?.trim());
  }
  return !!(profile.name?.trim() && profile.district?.trim() && profile.address?.trim());
}

export function computeProfileComplete(role: RoleKey, profile: ProfilePayload): boolean {
  if (role === 'elder' || role === 'family') {
    // 老人/家属：资料与支付方式均可延后
    if (role === 'elder') return true;
    return baseProfileFieldsComplete(role, profile);
  }
  if (role === 'student') {
    return isStudentAuditProfileComplete(profile);
  }
  if (!profile.paymentAccountConfigured) return false;
  if (profile.profileComplete === true && profile.paymentAccountConfigured) return true;
  return baseProfileFieldsComplete(role, profile);
}

async function fetchProfileForRole(role: RoleKey): Promise<ProfilePayload> {
  const [profile, payment] = await Promise.all([
    role === 'student'
      ? fetchStudentProfile()
      : role === 'family'
        ? fetchFamilyProfile()
        : fetchElderSelfProfile(),
    fetchPaymentAccount(role).catch(() => ({ configured: false })),
  ]);
  return {
    ...profile,
    paymentAccountConfigured: payment.configured === true,
  };
}

export async function needsProfileOnboarding(role: RoleKey): Promise<boolean> {
  const roleStore = useRoleStore();
  const userId = roleStore.user?.id;
  if (!userId) return false;

  // 老人资料、支付方式均可延后，不拦截登录
  if (role === 'elder') return false;

  if (role === 'student') {
    const st = roleStore.roles.find((r) => r.role === 'student');
    if (st?.status === 'pending' || st?.status === 'rejected') return false;
    try {
      const profile = await fetchProfileForRole(role);
      if (!isStudentAuditProfileComplete(profile)) return true;
      markProfileOnboarded(role);
      return false;
    } catch {
      return true;
    }
  }

  if (role === 'family') {
    if (isProfileOnboardedLocal(userId, role)) return false;
    try {
      const profile = await fetchProfileForRole(role);
      if (baseProfileFieldsComplete(role, profile)) {
        markProfileOnboarded(role);
        return false;
      }
      return true;
    } catch {
      return false;
    }
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
  if (role === 'student') {
    const { routeStudentAfterAuth } = await import('./student-auth-route');
    await routeStudentAfterAuth();
    return;
  }
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

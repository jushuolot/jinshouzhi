import { ROLE_HOME } from '../config/tabs';
import { guestBrowseRole, isGuestBrowse } from './guest-browse';

const TOUR_SEEN_KEY = 'nuanban_tour_seen_v1';

export function hasSeenTour(): boolean {
  try {
    return uni.getStorageSync(TOUR_SEEN_KEY) === true;
  } catch {
    return false;
  }
}

export function markTourSeen(): void {
  try {
    uni.setStorageSync(TOUR_SEEN_KEY, true);
  } catch {
    /* ignore */
  }
}

/** 回访：游客会话有效则回演示首页，否则登录页 */
export function resolveReturnEntryPath(): string {
  if (isGuestBrowse()) {
    const role = guestBrowseRole();
    if (role) return ROLE_HOME[role];
  }
  return '/pages/common/login';
}

/** @deprecated use resolveReturnEntryPath */
export function resolveGuestEntryPath(): string {
  return resolveReturnEntryPath();
}

/** 未登录用户离开 launch 后的目标页 */
export function resolveUnauthenticatedEntry(forceTour = false): string {
  if (forceTour || !hasSeenTour()) {
    return '/pages/common/demo-tour';
  }
  return resolveReturnEntryPath();
}

/** 已登录用户闪屏时长 */
export const LOGGED_IN_SPLASH_MS = 3000;

/** 回访未登录闪屏时长 */
export const RETURN_SPLASH_MS = 800;

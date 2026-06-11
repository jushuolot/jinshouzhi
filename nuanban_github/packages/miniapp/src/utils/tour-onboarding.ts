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

/** 回访游客：有演示身份则进首页，否则选角色 */
export function resolveGuestEntryPath(): string {
  const role = guestBrowseRole();
  if (isGuestBrowse() && role) {
    return ROLE_HOME[role];
  }
  return '/pages/common/guest-role-pick';
}

/** 未登录用户离开闪屏后的目标页 */
export function resolveUnauthenticatedEntry(forceTour = false): string {
  if (forceTour || !hasSeenTour()) {
    return '/pages/common/demo-tour';
  }
  return resolveGuestEntryPath();
}

/** 闪屏展示时长（ms） */
export function splashDurationMs(forceTour = false): number {
  if (forceTour || !hasSeenTour()) return 1800;
  return 800;
}

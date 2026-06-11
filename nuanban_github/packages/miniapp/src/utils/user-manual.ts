const STORAGE_KEY = 'nuanban_user_manual_accepted';

export function isUserManualAccepted(): boolean {
  try {
    return uni.getStorageSync(STORAGE_KEY) === true;
  } catch {
    return false;
  }
}

export function markUserManualAccepted() {
  try {
    uni.setStorageSync(STORAGE_KEY, true);
  } catch {
    /* ignore */
  }
}

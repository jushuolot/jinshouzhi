const MANUAL_KEY = 'nuanban_user_manual_accepted';
const PRIVACY_KEY = 'nuanban_privacy_policy_accepted';

export function isUserManualAccepted(): boolean {
  try {
    return uni.getStorageSync(MANUAL_KEY) === true && uni.getStorageSync(PRIVACY_KEY) === true;
  } catch {
    return false;
  }
}

export function markRegistrationConsent() {
  try {
    uni.setStorageSync(MANUAL_KEY, true);
    uni.setStorageSync(PRIVACY_KEY, true);
  } catch {
    /* ignore */
  }
}

/** @deprecated use markRegistrationConsent */
export function markUserManualAccepted() {
  markRegistrationConsent();
}

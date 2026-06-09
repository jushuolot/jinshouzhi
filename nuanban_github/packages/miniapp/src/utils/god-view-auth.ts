/** 上帝视角超级管理员解锁（演示栈 · 会话 8 小时） */
const UNLOCK_KEY = 'god_view_unlocked';
const UNLOCK_TTL_MS = 8 * 60 * 60 * 1000;

/** 默认演示密码，可通过 VITE_GOD_VIEW_PASSWORD 覆盖 */
export function getGodViewPassword(): string {
  return import.meta.env.VITE_GOD_VIEW_PASSWORD || 'nuanban2025';
}

export function isGodViewUnlocked(): boolean {
  try {
    const raw = uni.getStorageSync(UNLOCK_KEY) as { at?: number } | null;
    if (!raw?.at) return false;
    return Date.now() - raw.at < UNLOCK_TTL_MS;
  } catch {
    return false;
  }
}

export function setGodViewUnlocked() {
  uni.setStorageSync(UNLOCK_KEY, { at: Date.now() });
}

export function clearGodViewUnlocked() {
  uni.removeStorageSync(UNLOCK_KEY);
}

export const GOD_VIEW_GATE_PATH = '/pages/common/god-view-gate';

export function openGodViewGate() {
  uni.navigateTo({ url: GOD_VIEW_GATE_PATH });
}

export function guardGodViewOrRedirect(): boolean {
  if (isGodViewUnlocked()) return true;
  uni.redirectTo({ url: GOD_VIEW_GATE_PATH });
  return false;
}

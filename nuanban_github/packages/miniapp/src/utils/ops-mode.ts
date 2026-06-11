/** 运营模式：口令门禁 + 可隐藏入口（登录页「暖」图标唤起） */

import { OPS_HOME_PATH, OPS_SHELL_ROUTE_KEYS } from '../config/ops-tabs';

const OPS_SESSION_KEY = 'ops_mode_session_v1';
const OPS_HIDDEN_KEY = 'ops_mode_hidden_v1';
const OPS_PASS_KEY = 'ops_mode_pass_v1';

const DEFAULT_PASSPHRASE = import.meta.env.VITE_OPS_PASSPHRASE || 'nuanban2026';
const SESSION_HOURS = 8;

function hashPassphrase(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return `ops_${h.toString(36)}`;
}

function expectedPassHash(): string {
  try {
    const custom = uni.getStorageSync(OPS_PASS_KEY) as string;
    if (custom) return custom;
  } catch {
    /* ignore */
  }
  return hashPassphrase(DEFAULT_PASSPHRASE);
}

export function verifyOpsPassphrase(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  return hashPassphrase(trimmed) === expectedPassHash();
}

export function setOpsPassphrase(passphrase: string) {
  uni.setStorageSync(OPS_PASS_KEY, hashPassphrase(passphrase.trim()));
}

export function isOpsSessionActive(): boolean {
  try {
    const raw = uni.getStorageSync(OPS_SESSION_KEY) as string;
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { exp?: number };
    return typeof parsed.exp === 'number' && Date.now() < parsed.exp;
  } catch {
    return false;
  }
}

export function startOpsSession(hours = SESSION_HOURS) {
  uni.setStorageSync(
    OPS_SESSION_KEY,
    JSON.stringify({ exp: Date.now() + hours * 3600 * 1000 }),
  );
}

export function clearOpsSession() {
  uni.removeStorageSync(OPS_SESSION_KEY);
}

export function isOpsEntryHidden(): boolean {
  try {
    return uni.getStorageSync(OPS_HIDDEN_KEY) === true;
  } catch {
    return false;
  }
}

export function setOpsEntryHidden(hidden: boolean) {
  uni.setStorageSync(OPS_HIDDEN_KEY, hidden);
}

function navigateOps(url: string) {
  uni.navigateTo({
    url,
    fail: () => {
      uni.reLaunch({ url });
    },
  });
}

export function openOpsMode() {
  if (isOpsSessionActive()) {
    navigateOps(OPS_HOME_PATH);
    return;
  }
  navigateOps('/pages/common/ops-gate');
}

/** 运营台 shell 内页：底部 Tab 已导航，隐藏右下角 FAB */
export function isOnOpsShellPage(): boolean {
  try {
    const pages = getCurrentPages();
    const route = pages[pages.length - 1]?.route ?? '';
    return OPS_SHELL_ROUTE_KEYS.some((key) => route.includes(key));
  } catch {
    return false;
  }
}

/** ops-home 等页 onShow 调用；未登录运营会话则跳转口令页 */
export function requireOpsSession(): boolean {
  if (isOpsSessionActive()) return true;
  uni.redirectTo({ url: '/pages/common/ops-gate' });
  return false;
}

export { OPS_HOME_PATH };

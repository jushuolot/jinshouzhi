/**
 * 本地敏感偏好加密存储（非令牌）
 * 登录 token 仍由 PocketBase JWT + Bearer 头传输；此处用于验收进度等偏好数据防明文落盘。
 */

const ENC_PREFIX = 'nb_enc:';
const SALT = 'nuanban-secure-v1';

function xorBytes(text: string): number[] {
  return [...text].map((ch, i) => ch.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length));
}

function encode(value: string): string {
  try {
    const bytes = xorBytes(value);
    if (typeof btoa === 'function') {
      return ENC_PREFIX + btoa(String.fromCharCode(...bytes));
    }
    return ENC_PREFIX + value;
  } catch {
    return value;
  }
}

function decode(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) return stored;
  try {
    const raw = stored.slice(ENC_PREFIX.length);
    if (typeof atob !== 'function') return raw;
    const bytes = [...atob(raw)].map((c) => c.charCodeAt(0));
    return String.fromCharCode(...bytes.map((b, i) => b ^ SALT.charCodeAt(i % SALT.length)));
  } catch {
    return stored;
  }
}

export function setSecureJson(key: string, value: unknown) {
  try {
    const plain = JSON.stringify(value);
    uni.setStorageSync(key, encode(plain));
  } catch {
    /* ignore */
  }
}

export function getSecureJson<T>(key: string, fallback: T): T {
  try {
    const raw = uni.getStorageSync(key);
    if (!raw) return fallback;
    const plain = typeof raw === 'string' ? decode(raw) : JSON.stringify(raw);
    return JSON.parse(plain) as T;
  } catch {
    return fallback;
  }
}

export function removeSecure(key: string) {
  try {
    uni.removeStorageSync(key);
  } catch {
    /* ignore */
  }
}

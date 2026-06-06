import { useRoleStore } from '../store/role';
import { demoMockRequest, isDemoMockEnabled } from './demo-mock';

/** PocketBase REST root, e.g. http://localhost:8090/api */
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api';

export function isDemoMockMode(): boolean {
  return isDemoMockEnabled();
}

export interface PbErrorBody {
  message?: string;
  data?: Record<string, { message?: string }>;
}

const BACKEND_DOWN_HINT =
  '后端未启动。请先打开 Docker Desktop，再在项目根目录执行：docker compose up -d pocketbase';

function isBackendUnreachable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { errMsg?: string; message?: string; statusCode?: number };
  const text = `${e.errMsg ?? ''} ${e.message ?? ''}`.toLowerCase();
  if (e.statusCode === 500 || e.statusCode === 502 || e.statusCode === 503) return true;
  return (
    text.includes('request:fail') ||
    text.includes('timeout') ||
    text.includes('econnrefused') ||
    text.includes('network') ||
    text.includes('http 500') ||
    text.includes('http 502') ||
    text.includes('http 503')
  );
}

export function pbErrorMessage(err: unknown): string {
  if (isBackendUnreachable(err)) return BACKEND_DOWN_HINT;
  if (!err || typeof err !== 'object') return '请求失败';
  const body = err as PbErrorBody;
  if (body.message) {
    if (isBackendUnreachable({ message: body.message })) return BACKEND_DOWN_HINT;
    return body.message;
  }
  if (body.data) {
    const first = Object.values(body.data)[0];
    if (first?.message) return first.message;
  }
  return '请求失败';
}

export function request<T>(options: UniApp.RequestOptions): Promise<T> {
  const role = useRoleStore();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.header || {}),
    ...(role.token ? { Authorization: `Bearer ${role.token}` } : {}),
    ...(role.activeRole ? { 'X-Active-Role': role.activeRole } : {}),
  };
  if (isDemoMockEnabled()) {
    return demoMockRequest<T>({ ...options, header: headers });
  }
  const url = options.url.startsWith('http') ? options.url : `${API_BASE}${options.url}`;

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url,
      timeout: 15000,
      header: headers,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
          return;
        }
        if (res.statusCode === 401) {
          role.logout();
          uni.reLaunch({ url: '/pages/common/login' });
          reject(new Error('未登录'));
          return;
        }
        const payload =
          res.data && typeof res.data === 'object'
            ? res.data
            : { message: `HTTP ${res.statusCode}`, statusCode: res.statusCode };
        reject(payload);
      },
      fail: (e) => reject({ ...(typeof e === 'object' && e ? e : {}), errMsg: (e as { errMsg?: string })?.errMsg ?? 'request:fail' }),
    });
  });
}

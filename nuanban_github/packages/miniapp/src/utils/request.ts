import { useRoleStore } from '../store/role';
import {
  isGithubPagesHost,
  isMixedContentApiBlock,
  NUANBAN_STAGING_H5_ORIGIN,
} from '../config/remote-api';
import { demoMockRequest, isDemoMockEnabled } from './demo-mock';
import { guestBrowseRole, isGuestBrowse } from './guest-browse';

/** 构建时 API 根；在阿里云等线上环境自动纠正 localhost / 相对路径 */
export function resolveApiBase(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api').replace(
    /\/$/,
    '',
  );
  if (typeof window === 'undefined') return configured;

  const { hostname, origin } = window.location;
  const onDevHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (configured === '/api') {
    return onDevHost ? configured : `${origin}/api`;
  }
  if (!onDevHost && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api$/i.test(configured)) {
    return `${origin}/api`;
  }
  return configured;
}

/** PocketBase REST root, e.g. http://localhost:8090/api */
export const API_BASE = resolveApiBase();

function serializeJsonBody(method: string | undefined, data: unknown, contentType: string): unknown {
  const m = (method || 'GET').toUpperCase();
  if (m === 'GET' || m === 'HEAD' || data == null) return data;
  if (!contentType.includes('application/json')) return data;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') return JSON.stringify(data);
  return data;
}

export function isDemoMockMode(): boolean {
  return isDemoMockEnabled();
}

export interface PbErrorBody {
  message?: string;
  data?: Record<string, { message?: string }>;
}

function backendDownHint(): string {
  if (typeof window !== 'undefined') {
    const onGithubPages = isGithubPagesHost();
    const onDevHost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (onGithubPages) {
      if (isDemoMockEnabled()) {
        return '网络或服务暂不可用，请稍后重试，或点底部「游客账号」先体验';
      }
      if (isMixedContentApiBlock()) {
        return `GitHub 为 HTTPS，浏览器会拦截 HTTP API。请暂用阿里云版继续：${NUANBAN_STAGING_H5_ORIGIN}/#/pages/common/login（服务器需执行 deploy-staging-https-api.sh 后可恢复 GitHub 直连）`;
      }
      return '无法连接远程 API，请检查网络或稍后重试';
    }
    if (!onDevHost) {
      return '无法连接服务器，请检查网络后重试';
    }
  }
  return '后端未启动。请先打开 Docker Desktop，再在项目根目录执行：docker compose up -d pocketbase';
}

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
  if (isBackendUnreachable(err)) return backendDownHint();
  if (!err || typeof err !== 'object') return '请求失败';
  const body = err as PbErrorBody;
  if (body.message) {
    if (isBackendUnreachable({ message: body.message })) return backendDownHint();
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
  const guestRole = isGuestBrowse() ? guestBrowseRole() : null;
  const activeRole = role.activeRole ?? guestRole ?? undefined;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.header || {}),
    ...(role.token ? { Authorization: `Bearer ${role.token}` } : {}),
    ...(activeRole ? { 'X-Active-Role': activeRole } : {}),
  };
  if (isDemoMockEnabled()) {
    return demoMockRequest<T>({ ...options, header: headers });
  }
  const apiBase = resolveApiBase();
  const url = options.url.startsWith('http') ? options.url : `${apiBase}${options.url}`;
  const contentType = String(headers['Content-Type'] || headers['content-type'] || '');
  const data = serializeJsonBody(options.method, options.data, contentType);

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url,
      data,
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

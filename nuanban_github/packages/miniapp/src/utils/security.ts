/** 客户端安全态检测（传输层与运行环境） */

import { isDemoMockEnabled } from './demo-mock';
import { APP_VERSION_LINE } from '../config/brand';
import { releaseLabel } from '../config/release';

export interface SecurityStatus {
  releaseChannel: string;
  appVersion: string;
  isDemoMock: boolean;
  isSecureContext: boolean;
  protocol: string;
  connectionLabel: string;
  tokenProtected: boolean;
  roleHeaderEnabled: boolean;
  localDataNote: string;
}

export function getSecurityStatus(): SecurityStatus {
  const isDemo = isDemoMockEnabled();
  let protocol = 'unknown';
  let isSecure = false;
  if (typeof window !== 'undefined') {
    protocol = window.location.protocol;
    isSecure = window.isSecureContext === true || protocol === 'https:';
  }
  const connectionLabel = isSecure
    ? 'HTTPS 加密传输'
    : isDemo
      ? '演示 HTTP（GitHub Pages）'
      : 'HTTP（建议部署 HTTPS）';

  return {
    releaseChannel: releaseLabel() || '开发',
    appVersion: APP_VERSION_LINE,
    isDemoMock: isDemo,
    isSecureContext: isSecure,
    protocol,
    connectionLabel,
    tokenProtected: true,
    roleHeaderEnabled: true,
    localDataNote: isDemo
      ? '测试版数据存于浏览器 localStorage，仅供演示'
      : '正式版业务数据存于服务端 PocketBase，本地仅缓存登录令牌',
  };
}

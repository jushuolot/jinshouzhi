import { APP_VERSION_LABEL } from './brand';

export type ReleaseChannel =
  | 'formal'
  | 'release'
  | 'stable'
  | 'public'
  | 'test'
  | 'production'
  | 'development';

export const RELEASE_CHANNEL = (import.meta.env.VITE_RELEASE_CHANNEL ||
  'development') as ReleaseChannel;

/** 登录页角标 */
const LABELS: Record<string, string> = {
  formal: '正式版',
  development: '开发版',
  release: '发布版',
  test: '发布版',
  stable: '发布稳定版',
  public: '发布稳定版',
  production: '发布稳定版',
};

/** 登录页角标：正式/稳定渠道显示产品版本 */
export function releaseLabel(): string {
  if (
    RELEASE_CHANNEL === 'formal' ||
    RELEASE_CHANNEL === 'stable' ||
    RELEASE_CHANNEL === 'public' ||
    RELEASE_CHANNEL === 'production' ||
    RELEASE_CHANNEL === 'release'
  ) {
    return APP_VERSION_LABEL;
  }
  return LABELS[RELEASE_CHANNEL] || APP_VERSION_LABEL;
}

export function appVersionLabel(): string {
  return APP_VERSION_LABEL;
}

/** 本地产品验证（最新功能，真实登录流） */
export function isFormalBuild(): boolean {
  return RELEASE_CHANNEL === 'formal';
}

/** GitHub Pages 发布版 */
export function isReleaseBuild(): boolean {
  return RELEASE_CHANNEL === 'release' || RELEASE_CHANNEL === 'test';
}

/** 阿里云发布稳定版 */
export function isStableBuild(): boolean {
  return (
    RELEASE_CHANNEL === 'stable' ||
    RELEASE_CHANNEL === 'public' ||
    RELEASE_CHANNEL === 'production'
  );
}

/** @deprecated 使用 isStableBuild */
export function isPublicBuild(): boolean {
  return isStableBuild();
}

/** 本地开发机（旧 development 渠道） */
export function isLocalDevBuild(): boolean {
  return RELEASE_CHANNEL === 'development';
}

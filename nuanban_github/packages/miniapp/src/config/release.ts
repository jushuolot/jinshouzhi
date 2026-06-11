export type ReleaseChannel = 'formal' | 'public' | 'test' | 'production' | 'development';

export const RELEASE_CHANNEL = (import.meta.env.VITE_RELEASE_CHANNEL ||
  'development') as ReleaseChannel;

const LABELS: Record<string, string> = {
  formal: '正式版',
  public: '发布版',
  production: '发布版',
  test: '测试版',
  development: '开发版',
};

export function releaseLabel(): string {
  return LABELS[RELEASE_CHANNEL] || '';
}

/** GitHub 正式制作环境 */
export function isFormalBuild(): boolean {
  return RELEASE_CHANNEL === 'formal';
}

/** 阿里云等对外发布环境 */
export function isPublicBuild(): boolean {
  return RELEASE_CHANNEL === 'public' || RELEASE_CHANNEL === 'production';
}

/** 本地测试机 */
export function isLocalDevBuild(): boolean {
  return RELEASE_CHANNEL === 'development' || RELEASE_CHANNEL === 'test';
}

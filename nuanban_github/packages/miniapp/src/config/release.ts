export type ReleaseChannel = 'test' | 'production' | 'development';

export const RELEASE_CHANNEL = (import.meta.env.VITE_RELEASE_CHANNEL ||
  'development') as ReleaseChannel;

const LABELS: Record<ReleaseChannel, string> = {
  test: '测试版',
  production: '正式版',
  development: '开发版',
};

export function releaseLabel(): string {
  return LABELS[RELEASE_CHANNEL] || '';
}

import { isDemoMockEnabled } from '../utils/demo-mock';
import { RELEASE_CHANNEL } from './release';

/**
 * 正式产品鉴权：无演示捷径、须完整短信验证码流程。
 * 本地 formal、GitHub release、阿里云 stable/public/production。
 */
export function isFormalAuthMode(): boolean {
  if (isDemoMockEnabled()) return false;
  return (
    RELEASE_CHANNEL === 'formal' ||
    RELEASE_CHANNEL === 'release' ||
    RELEASE_CHANNEL === 'stable' ||
    RELEASE_CHANNEL === 'public' ||
    RELEASE_CHANNEL === 'production'
  );
}

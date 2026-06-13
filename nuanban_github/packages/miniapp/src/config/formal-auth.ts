import { isDemoMockEnabled } from '../utils/demo-mock';
import { RELEASE_CHANNEL } from './release';

/**
 * 正式产品鉴权：无演示捷径、须完整短信验证码流程。
 * 本地 formal、阿里云 stable；GitHub 发布版仍为 Mock，不走此模式。
 */
export function isFormalAuthMode(): boolean {
  if (isDemoMockEnabled()) return false;
  return (
    RELEASE_CHANNEL === 'formal' ||
    RELEASE_CHANNEL === 'stable' ||
    RELEASE_CHANNEL === 'public' ||
    RELEASE_CHANNEL === 'production'
  );
}

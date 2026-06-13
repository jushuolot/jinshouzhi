const MOCK_AVATAR_KEY = 'mock_avatar_url';

export function getMockAvatarUrl(userId: string): string {
  try {
    return (uni.getStorageSync(`${MOCK_AVATAR_KEY}_${userId}`) as string) || '';
  } catch {
    return '';
  }
}

export function setMockAvatarUrl(userId: string, dataUrl: string) {
  uni.setStorageSync(`${MOCK_AVATAR_KEY}_${userId}`, dataUrl);
}

const MOCK_VERIFICATION_KEY = 'mock_verification_photo';
const MOCK_CARTOON_KEY = 'mock_cartoon_avatar_id';

export function getMockVerificationPhotoUrl(userId: string): string {
  try {
    return (uni.getStorageSync(`${MOCK_VERIFICATION_KEY}_${userId}`) as string) || '';
  } catch {
    return '';
  }
}

export function setMockVerificationPhotoUrl(userId: string, dataUrl: string) {
  uni.setStorageSync(`${MOCK_VERIFICATION_KEY}_${userId}`, dataUrl);
}

export function getMockCartoonAvatarId(userId: string): string {
  try {
    return (uni.getStorageSync(`${MOCK_CARTOON_KEY}_${userId}`) as string) || '';
  } catch {
    return '';
  }
}

export function setMockCartoonAvatarId(userId: string, avatarId: string) {
  uni.setStorageSync(`${MOCK_CARTOON_KEY}_${userId}`, avatarId);
}

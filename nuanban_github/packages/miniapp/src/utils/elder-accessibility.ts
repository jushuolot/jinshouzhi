const KEY = 'nuanban_elder_large_font';

export function isElderLargeFont(): boolean {
  try {
    return uni.getStorageSync(KEY) === '1';
  } catch {
    return false;
  }
}

export function setElderLargeFont(enabled: boolean) {
  uni.setStorageSync(KEY, enabled ? '1' : '0');
}

export function elderFontClass(): string {
  return isElderLargeFont() ? 'elder-large' : '';
}

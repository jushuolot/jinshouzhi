/** 全站 Toast 统一时长与图标，减少交互反馈不一致 */
const HINT_MS = 2200;
const OK_MS = 1600;

export function toastHint(title: string) {
  uni.showToast({ title, icon: 'none', duration: HINT_MS });
}

export function toastOk(title: string) {
  uni.showToast({ title, icon: 'success', duration: OK_MS });
}

export function toastFail(title: string) {
  uni.showToast({ title, icon: 'none', duration: HINT_MS });
}

/** 检测是否在鸿蒙 / HarmonyOS 环境（浏览器或 WebView） */
export function isHarmonyOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /HarmonyOS|OpenHarmony|ArkWeb/i.test(ua) || /HUAWEI/i.test(ua);
}

export function applyHarmonyClass() {
  if (isHarmonyOS()) {
    document.documentElement.classList.add('harmonyos');
  }
}

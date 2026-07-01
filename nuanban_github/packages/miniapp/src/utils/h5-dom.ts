/** H5 浏览器 DOM 辅助（地图点选、尺寸测量等） */

export function isH5Dom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isInsecureMobileH5(): boolean {
  if (!isH5Dom()) return false;
  if (window.isSecureContext) return false;
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(navigator.userAgent);
}

export function measureMapStage(
  el: HTMLElement | null,
  fallback: { w: number; h: number },
): { w: number; h: number } {
  if (el) {
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w > 0 && h > 0) {
      return { w, h: Math.max(h, 260) };
    }
  }
  const vw = isH5Dom() ? window.innerWidth || fallback.w : fallback.w;
  return { w: Math.min(Math.round(vw - 32), fallback.w), h: fallback.h };
}

export function eventToLocalPoint(
  e: MouseEvent | TouchEvent,
  el: HTMLElement,
): { x: number; y: number } | null {
  const rect = el.getBoundingClientRect();
  let clientX: number | undefined;
  let clientY: number | undefined;
  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('changedTouches' in e && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if ('clientX' in e) {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  if (clientX == null || clientY == null) return null;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

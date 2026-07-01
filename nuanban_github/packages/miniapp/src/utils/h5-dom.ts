/** H5 浏览器 DOM 辅助（地图点选、尺寸测量等） */

import { getCurrentInstance, type ComponentInternalInstance } from 'vue';

export function isH5Dom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isMobileH5Browser(): boolean {
  if (!isH5Dom()) return false;
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|OpenHarmony/i.test(navigator.userAgent);
}

export function isInsecureMobileH5(): boolean {
  if (!isMobileH5Browser()) return false;
  return !window.isSecureContext;
}

export function defaultMapStageSize(): { w: number; h: number } {
  const vw = isH5Dom() ? window.innerWidth || 360 : 360;
  return { w: Math.min(Math.round(vw - 32), 360), h: 280 };
}

export function measureMapStage(
  el: HTMLElement | null,
  fallback: { w: number; h: number },
): { w: number; h: number } {
  if (el && typeof el.getBoundingClientRect === 'function') {
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w > 0 && h > 0) {
      return { w, h: Math.max(h, 260) };
    }
  }
  return fallback;
}

/** uni-app H5：用组件内 SelectorQuery 量地图容器（比 template ref 可靠） */
export function queryMapStageSize(
  selector: string,
  fallback = defaultMapStageSize(),
): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const inst = getCurrentInstance() as ComponentInternalInstance | null;
    const q = uni.createSelectorQuery();
    if (inst?.proxy) {
      q.in(inst.proxy);
    }
    q.select(selector)
      .boundingClientRect((rect) => {
        if (rect && !Array.isArray(rect) && rect.width > 0) {
          resolve({
            w: Math.round(rect.width),
            h: Math.max(Math.round(rect.height), 260),
          });
        } else {
          resolve(fallback);
        }
      })
      .exec();
  });
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

/** uni @tap 事件在 H5 上常无 clientX，用 detail 坐标 */
export function uniTapToLocalPoint(
  e: { detail?: { x?: number; y?: number } },
  el: HTMLElement,
): { x: number; y: number } | null {
  const x = e.detail?.x;
  const y = e.detail?.y;
  if (x == null || y == null) return null;
  const rect = el.getBoundingClientRect();
  return { x: x - rect.left, y: y - rect.top };
}

/** 瓦片地图舞台：描点 / 拖动分模式，避免轻触被当成平移 */

import { eventToLocalPoint } from './h5-dom';

export type MapGestureMode = 'mark' | 'pan';

export type MapStageGestureHandlers = {
  onTap: (localX: number, localY: number) => void;
  onPan: (dx: number, dy: number) => void;
  onPinchZoom: (factor: number) => void;
  onWheelZoom: (deltaY: number) => void;
};

const TAP_SLOP_PX = 22;

function touchLocal(touch: Touch, el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function bindMapStageGestures(
  el: HTMLElement,
  handlers: MapStageGestureHandlers,
  getMode: () => MapGestureMode = () => 'mark',
): () => void {
  let touchStart: { x: number; y: number } | null = null;
  let moved = false;
  let pinching = false;
  let lastPinchDist = 0;
  let mouseDown: { x: number; y: number } | null = null;
  let mouseMoved = false;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      pinching = true;
      moved = true;
      lastPinchDist = touchDistance(e.touches[0], e.touches[1]);
      return;
    }
    if (e.touches.length !== 1) return;
    const pt = touchLocal(e.touches[0], el);
    touchStart = pt;
    moved = false;
    pinching = false;
    lastPinchDist = 0;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0], e.touches[1]);
      if (lastPinchDist > 0 && dist > 0) {
        const factor = dist / lastPinchDist;
        if (Math.abs(factor - 1) > 0.008) {
          handlers.onPinchZoom(factor);
        }
      }
      lastPinchDist = dist;
      pinching = true;
      moved = true;
      return;
    }
    if (!touchStart || e.touches.length !== 1 || pinching) return;

    const mode = getMode();
    const pt = touchLocal(e.touches[0], el);
    const dx = pt.x - touchStart.x;
    const dy = pt.y - touchStart.y;
    const dist = Math.hypot(dx, dy);

    if (mode === 'mark') {
      if (dist > TAP_SLOP_PX) moved = true;
      e.preventDefault();
      return;
    }

    if (!moved && dist > TAP_SLOP_PX) {
      moved = true;
    }
    if (moved) {
      e.preventDefault();
      const prev = touchStart;
      handlers.onPan(pt.x - prev.x, pt.y - prev.y);
      touchStart = pt;
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (pinching) {
      if (e.touches.length < 2) {
        pinching = false;
        lastPinchDist = 0;
      }
      touchStart = null;
      return;
    }

    const mode = getMode();
    const t = e.changedTouches[0];

    if (mode === 'mark' && touchStart && t) {
      const pt = touchLocal(t, el);
      if (Math.hypot(pt.x - touchStart.x, pt.y - touchStart.y) <= TAP_SLOP_PX) {
        handlers.onTap(pt.x, pt.y);
      }
      touchStart = null;
      moved = false;
      return;
    }

    if (!touchStart || moved) {
      touchStart = null;
      return;
    }
    if (t) {
      const pt = touchLocal(t, el);
      handlers.onTap(pt.x, pt.y);
    }
    touchStart = null;
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    mouseDown = { x: e.clientX, y: e.clientY };
    mouseMoved = false;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!mouseDown || getMode() === 'mark') return;
    const dx = e.clientX - mouseDown.x;
    const dy = e.clientY - mouseDown.y;
    if (!mouseMoved && Math.hypot(dx, dy) > TAP_SLOP_PX) {
      mouseMoved = true;
    }
    if (mouseMoved) {
      handlers.onPan(dx, dy);
      mouseDown = { x: e.clientX, y: e.clientY };
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    if (!mouseDown) return;
    if (!mouseMoved) {
      const pt = eventToLocalPoint(e, el);
      if (pt) handlers.onTap(pt.x, pt.y);
    }
    mouseDown = null;
    mouseMoved = false;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    handlers.onWheelZoom(e.deltaY);
  };

  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('touchend', onTouchEnd, { passive: false });
  el.addEventListener('touchcancel', onTouchEnd, { passive: false });
  el.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  el.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
    el.removeEventListener('touchcancel', onTouchEnd);
    el.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    el.removeEventListener('wheel', onWheel);
  };
}

export function resolveMapStageElement(
  refValue: unknown,
  fallbackSelector: string,
): HTMLElement | null {
  if (refValue instanceof HTMLElement) return refValue;
  const maybeEl = (refValue as { $el?: unknown } | null)?.$el;
  if (maybeEl instanceof HTMLElement) return maybeEl;
  if (typeof document !== 'undefined') {
    const found = document.querySelector(fallbackSelector);
    if (found instanceof HTMLElement) return found;
  }
  return null;
}

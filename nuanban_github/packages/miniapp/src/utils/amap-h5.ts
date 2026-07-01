/** 高德 JS API 2.0（非开源，开放平台免费申请 Key） */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AMapNS = any;

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode?: string };
    AMapLoader?: {
      load: (opts: { key: string; version?: string }) => Promise<AMapNS>;
    };
  }
}

let loadPromise: Promise<AMapNS> | null = null;

export function getAmapKey(): string {
  return String(import.meta.env.VITE_AMAP_KEY || '').trim();
}

export function getAmapSecurityCode(): string {
  return String(import.meta.env.VITE_AMAP_SECURITY_CODE || '').trim();
}

export function hasAmapKey(): boolean {
  return !!getAmapKey();
}

export async function loadAmap(plugins: string[] = []): Promise<AMapNS> {
  if (loadPromise) return loadPromise;

  const key = getAmapKey();
  if (!key) {
    return Promise.reject(new Error('未配置 VITE_AMAP_KEY'));
  }

  const sec = getAmapSecurityCode();
  if (sec) {
    window._AMapSecurityConfig = { securityJsCode: sec };
  }

  loadPromise = new Promise((resolve, reject) => {
    const boot = () => {
      if (!window.AMapLoader) {
        reject(new Error('高德 Loader 未就绪'));
        return;
      }
      window.AMapLoader.load({ key, version: '2.0', plugins })
        .then(resolve)
        .catch(reject);
    };

    if (window.AMapLoader) {
      boot();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://webapi.amap.com/loader.js';
    script.async = true;
    script.onload = boot;
    script.onerror = () => reject(new Error('高德地图脚本加载失败'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function createAmapMap(
  container: HTMLElement,
  centerLng: number,
  centerLat: number,
  zoom: number,
): Promise<{ map: AMapNS; AMap: AMapNS; destroy: () => void }> {
  const AMap = await loadAmap(['AMap.ToolBar', 'AMap.Scale']);
  const map = new AMap.Map(container, {
    zoom,
    center: [centerLng, centerLat],
    viewMode: '2D',
    dragEnable: true,
    zoomEnable: true,
    pinchEnable: true,
    scrollWheel: true,
    doubleClickZoom: true,
    touchZoom: true,
  });
  map.addControl(new AMap.ToolBar({ position: 'RT' }));
  map.addControl(new AMap.Scale());
  return {
    map,
    AMap,
    destroy: () => {
      map.destroy();
    },
  };
}

import { isRealMapMode } from './map-config';

export const DEMO_LOCATION = {
  lat: 31.2304,
  lng: 121.4737,
  label: '演示定位（上海）',
  isDemo: true as const,
};

export type ResolvedLocation = {
  lat: number;
  lng: number;
  label: string;
  isDemo: boolean;
};

export function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

export function isLocationPermissionError(msg: string): boolean {
  return /定位|location|permission|权限|denied|拒绝/i.test(msg);
}

function getUniLocationType(): UniApp.GetLocationType {
  // #ifdef H5
  return 'wgs84';
  // #endif
  // #ifndef H5
  return 'gcj02';
  // #endif
}

async function readH5Geolocation(timeoutMs: number): Promise<{ latitude: number; longitude: number }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('浏览器不支持定位');
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        const code = err?.code;
        if (code === 1) reject(new Error('定位被拒绝，请在浏览器设置中允许 localhost 使用位置'));
        else if (code === 2) reject(new Error('无法获取定位，请检查系统定位服务是否开启'));
        else if (code === 3) reject(new Error('定位超时，请稍后重试'));
        else reject(new Error('无法获取定位，请开启浏览器定位权限'));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

async function readUniLocation(timeoutMs: number): Promise<{ latitude: number; longitude: number }> {
  return Promise.race([
    new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      uni.getLocation({
        type: getUniLocationType(),
        success: resolve,
        fail: (e) => reject(new Error(e?.errMsg || '定位失败')),
      });
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('定位超时，请稍后重试')), timeoutMs);
    }),
  ]);
}

async function readPosition(timeoutMs: number): Promise<{ latitude: number; longitude: number }> {
  // #ifdef H5
  try {
    return await readH5Geolocation(timeoutMs);
  } catch (h5Err) {
    try {
      return await readUniLocation(Math.min(timeoutMs, 5000));
    } catch {
      throw h5Err;
    }
  }
  // #endif
  // #ifndef H5
  return readUniLocation(timeoutMs);
  // #endif
}

export async function getLocationWithFallback(timeoutMs = 8000): Promise<ResolvedLocation> {
  try {
    const loc = await readPosition(timeoutMs);
    return {
      lat: loc.latitude,
      lng: loc.longitude,
      label: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
      isDemo: false,
    };
  } catch (err) {
    if (isRealMapMode()) {
      throw err instanceof Error ? err : new Error('无法获取定位，请开启浏览器定位权限');
    }
    return { ...DEMO_LOCATION };
  }
}

export function getDemoLocation(): ResolvedLocation {
  return { ...DEMO_LOCATION };
}

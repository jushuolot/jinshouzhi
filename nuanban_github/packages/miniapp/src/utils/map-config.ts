/** 地图配置：瓦片免 Key；可选高德 JS API Key 启用官方底图 */

import { hasAmapKey } from './amap-h5';

export function isRealMapMode(): boolean {
  return import.meta.env.VITE_MAP_REAL === 'true' || import.meta.env.VITE_MAP_REAL === true;
}

/** 是否使用高德开放平台 JS API（需 VITE_AMAP_KEY） */
export function useOfficialAmap(): boolean {
  return hasAmapKey();
}

/** 地图配置：H5 使用 OpenStreetMap 瓦片（免费开源，无需 API Key） */

export function isRealMapMode(): boolean {
  return import.meta.env.VITE_MAP_REAL === 'true' || import.meta.env.VITE_MAP_REAL === true;
}

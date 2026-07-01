/** Web Mercator helpers for H5 map tile overlay */

export const TILE_SIZE = 256;
export const OSM_TILE_URL = 'https://tile.openstreetmap.org';
export const OSM_ATTRIBUTION = '© OpenStreetMap';

export type MapTileProvider = 'auto' | 'gaode' | 'gaode-webst' | 'tencent' | 'osm' | 'carto';

export function osmTileUrl(z: number, x: number, y: number): string {
  return `${OSM_TILE_URL}/${z}/${x}/${y}.png`;
}

/** 国内手机浏览器 OSM 常不可用 */
export function preferCnMapTiles(): boolean {
  if (typeof navigator === 'undefined') return true;
  const lang = navigator.language || '';
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  return (
    lang.startsWith('zh')
    || tz === 'Asia/Shanghai'
    || /HarmonyOS|OpenHarmony|MicroMessenger/i.test(navigator.userAgent)
  );
}

function tileSubdomain(x: number, y: number): number {
  return ((x + y) % 4) + 1;
}

/** 高德矢量详图（含路网 + 中文注记，wprd 正式 CDN） */
export function gaodeTileUrl(z: number, x: number, y: number): string {
  const s = tileSubdomain(x, y);
  return `https://wprd0${s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=7&x=${x}&y=${y}&z=${z}`;
}

/** 高德 webst 矢量备用源 */
export function gaodeWebstTileUrl(z: number, x: number, y: number): string {
  const s = tileSubdomain(x, y);
  return `https://webst0${s}.is.autonavi.com/appmaptile?style=7&x=${x}&y=${y}&z=${z}`;
}

/** 腾讯矢量底图（国内备用，非开源） */
export function tencentTileUrl(z: number, x: number, y: number): string {
  const s = (x + y) % 4;
  return `https://rt${s}.map.gtimg.com/realtimerender?z=${z}&x=${x}&y=${y}&type=vector&style=0`;
}

export function cartoTileUrl(z: number, x: number, y: number): string {
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
}

export function mapTileUrl(
  z: number,
  x: number,
  y: number,
  provider: MapTileProvider = 'auto',
): string {
  if (provider === 'gaode') return gaodeTileUrl(z, x, y);
  if (provider === 'gaode-webst') return gaodeWebstTileUrl(z, x, y);
  if (provider === 'tencent') return tencentTileUrl(z, x, y);
  if (provider === 'osm') return osmTileUrl(z, x, y);
  if (provider === 'carto') return cartoTileUrl(z, x, y);
  return preferCnMapTiles() ? gaodeTileUrl(z, x, y) : osmTileUrl(z, x, y);
}

export function mapAttribution(provider: MapTileProvider = 'auto'): string {
  if (provider === 'gaode' || provider === 'gaode-webst') return '© 高德地图';
  if (provider === 'tencent') return '© 腾讯地图';
  if (provider === 'carto') return '© CARTO © OpenStreetMap';
  if (provider === 'osm') return OSM_ATTRIBUTION;
  return preferCnMapTiles() ? '© 高德地图' : OSM_ATTRIBUTION;
}

/** 瓦片加载失败时切换图源（国内不走 CARTO 国外风格演示图） */
export function nextMapTileProvider(current: MapTileProvider): MapTileProvider {
  if (preferCnMapTiles()) {
    if (current === 'auto' || current === 'gaode') return 'gaode-webst';
    if (current === 'gaode-webst') return 'tencent';
    if (current === 'tencent') return 'osm';
    return 'osm';
  }
  if (current === 'auto' || current === 'osm') return 'carto';
  return 'osm';
}

export function latLngToWorld(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function worldToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

export function zoomToFitBounds(
  points: { lat: number; lng: number }[],
  width: number,
  height: number,
  padding = 48,
): { centerLat: number; centerLng: number; zoom: number } {
  if (!points.length) {
    return { centerLat: 31.2304, centerLng: 121.4737, zoom: 14 };
  }
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const innerW = Math.max(width - padding * 2, 80);
  const innerH = Math.max(height - padding * 2, 80);

  let zoom = 14;
  for (let z = 18; z >= 3; z--) {
    const nw = latLngToWorld(maxLat, minLng, z);
    const se = latLngToWorld(minLat, maxLng, z);
    if (se.x - nw.x <= innerW && se.y - nw.y <= innerH) {
      zoom = z;
      break;
    }
  }
  return { centerLat, centerLng, zoom };
}

export type MapPin = {
  id: number | string;
  lat: number;
  lng: number;
  label?: string;
  kind?: 'self' | 'coop' | 'other';
};

export function pixelToLatLng(
  x: number,
  y: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  width: number,
  height: number,
): { lat: number; lng: number } {
  const center = latLngToWorld(centerLat, centerLng, zoom);
  const worldX = center.x + x - width / 2;
  const worldY = center.y + y - height / 2;
  return worldToLatLng(worldX, worldY, zoom);
}

export function markerPixel(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const center = latLngToWorld(centerLat, centerLng, zoom);
  const point = latLngToWorld(lat, lng, zoom);
  return {
    x: point.x - center.x + width / 2,
    y: point.y - center.y + height / 2,
  };
}

export function visibleOsmTiles(
  centerLat: number,
  centerLng: number,
  zoom: number,
  width: number,
  height: number,
  provider: MapTileProvider = 'auto',
): { key: string; url: string; x: number; y: number }[] {
  const z = Math.round(zoom);
  const center = latLngToWorld(centerLat, centerLng, z);
  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const right = center.x + width / 2;
  const bottom = center.y + height / 2;
  const maxIndex = 2 ** z - 1;

  const minTileX = Math.max(0, Math.floor(left / TILE_SIZE));
  const maxTileX = Math.min(maxIndex, Math.floor(right / TILE_SIZE));
  const minTileY = Math.max(0, Math.floor(top / TILE_SIZE));
  const maxTileY = Math.min(maxIndex, Math.floor(bottom / TILE_SIZE));

  const tiles: { key: string; url: string; x: number; y: number }[] = [];
  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      tiles.push({
        key: `${z}-${tx}-${ty}`,
        url: mapTileUrl(z, tx, ty, provider),
        x: tx * TILE_SIZE - left,
        y: ty * TILE_SIZE - top,
      });
    }
  }
  return tiles;
}

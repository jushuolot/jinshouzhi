/** Web Mercator helpers for H5 map tile overlay */

export const TILE_SIZE = 256;
export const OSM_TILE_URL = 'https://tile.openstreetmap.org';
export const OSM_ATTRIBUTION = '© OpenStreetMap';

export function osmTileUrl(z: number, x: number, y: number): string {
  return `${OSM_TILE_URL}/${z}/${x}/${y}.png`;
}

/** 国内手机浏览器 OSM 常不可用，默认高德道路底图（演示描点） */
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

export function gaodeTileUrl(z: number, x: number, y: number): string {
  const s = ((x + y) % 4) + 1;
  return `https://webrd0${s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${x}&y=${y}&z=${z}`;
}

export function cartoTileUrl(z: number, x: number, y: number): string {
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
}

export function mapTileUrl(z: number, x: number, y: number, provider: 'auto' | 'gaode' | 'osm' | 'carto' = 'auto'): string {
  if (provider === 'gaode') return gaodeTileUrl(z, x, y);
  if (provider === 'osm') return osmTileUrl(z, x, y);
  if (provider === 'carto') return cartoTileUrl(z, x, y);
  return preferCnMapTiles() ? gaodeTileUrl(z, x, y) : osmTileUrl(z, x, y);
}

export function mapAttribution(provider: 'auto' | 'gaode' | 'osm' | 'carto' = 'auto'): string {
  if (provider === 'gaode') return '© 高德地图';
  if (provider === 'carto') return '© CARTO © OpenStreetMap';
  if (provider === 'osm') return OSM_ATTRIBUTION;
  return preferCnMapTiles() ? '© 高德地图' : OSM_ATTRIBUTION;
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
  provider: 'auto' | 'gaode' | 'osm' | 'carto' = 'auto',
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

/** Web Mercator helpers for H5 OpenStreetMap tile overlay (zero API key). */

export const TILE_SIZE = 256;
export const OSM_TILE_URL = 'https://tile.openstreetmap.org';
export const OSM_ATTRIBUTION = '© OpenStreetMap';

export function osmTileUrl(z: number, x: number, y: number): string {
  return `${OSM_TILE_URL}/${z}/${x}/${y}.png`;
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
        url: osmTileUrl(z, tx, ty),
        x: tx * TILE_SIZE - left,
        y: ty * TILE_SIZE - top,
      });
    }
  }
  return tiles;
}

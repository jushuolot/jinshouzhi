/** 服务区域：地图多点围成的多边形（可多个） */

export type GeoPoint = { lat: number; lng: number };

export type ServiceAreaPolygon = {
  id: string;
  label?: string;
  ring: GeoPoint[];
};

export type ServiceAreaGeo = {
  polygons: ServiceAreaPolygon[];
};

export function emptyServiceAreaGeo(): ServiceAreaGeo {
  return { polygons: [] };
}

export function parseServiceAreaGeo(raw: unknown): ServiceAreaGeo {
  if (!raw || typeof raw !== 'object') return emptyServiceAreaGeo();
  const o = raw as { polygons?: unknown };
  if (!Array.isArray(o.polygons)) return emptyServiceAreaGeo();
  const polygons: ServiceAreaPolygon[] = [];
  for (const item of o.polygons) {
    if (!item || typeof item !== 'object') continue;
    const p = item as { id?: string; label?: string; ring?: unknown };
    if (!Array.isArray(p.ring) || p.ring.length < 3) continue;
    const ring: GeoPoint[] = [];
    for (const pt of p.ring) {
      if (!pt || typeof pt !== 'object') continue;
      const g = pt as { lat?: number; lng?: number };
      if (typeof g.lat === 'number' && typeof g.lng === 'number') {
        ring.push({ lat: g.lat, lng: g.lng });
      }
    }
    if (ring.length >= 3) {
      polygons.push({
        id: String(p.id || `poly-${polygons.length + 1}`),
        label: p.label ? String(p.label) : undefined,
        ring,
      });
    }
  }
  return { polygons };
}

export function serviceAreaSummary(geo: ServiceAreaGeo): string {
  if (!geo.polygons.length) return '未选择';
  return geo.polygons
    .map((p, i) => p.label || `区域${i + 1}（${p.ring.length}点）`)
    .join('、');
}

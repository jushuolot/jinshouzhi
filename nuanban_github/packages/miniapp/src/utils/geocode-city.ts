/** 免费 OSM Nominatim：按城市名居中地图（运营老人档案选点用） */

const CITY_CACHE: Record<string, { lat: number; lng: number; zoom: number }> = {
  上海: { lat: 31.2304, lng: 121.4737, zoom: 11 },
  北京: { lat: 39.9042, lng: 116.4074, zoom: 11 },
  广州: { lat: 23.1291, lng: 113.2644, zoom: 11 },
  深圳: { lat: 22.5431, lng: 114.0579, zoom: 11 },
  杭州: { lat: 30.2741, lng: 120.1551, zoom: 11 },
  南京: { lat: 32.0603, lng: 118.7969, zoom: 11 },
};

export async function geocodeCityName(
  city: string,
): Promise<{ lat: number; lng: number; zoom: number } | null> {
  const q = city.trim();
  if (!q) return null;

  for (const [key, val] of Object.entries(CITY_CACHE)) {
    if (q.includes(key)) return val;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cn&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'NuanbanOps/1.0' },
    });
    if (!res.ok) return null;
    const list = (await res.json()) as { lat: string; lon: string; type?: string }[];
    const hit = list[0];
    if (!hit) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const zoom = hit.type === 'city' || hit.type === 'administrative' ? 11 : 13;
    return { lat, lng, zoom };
  } catch {
    return null;
  }
}

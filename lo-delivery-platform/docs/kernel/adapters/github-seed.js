/**
 * Tier-0 免费链环：GitHub 静态 JSON（空间 · 货主下单 · 全球控制塔）
 */
function seedUrls(filename) {
  const urls = [];
  if (typeof window !== 'undefined' && window.LOT_CHAIN?.seedUrl) {
    urls.push(`${window.LOT_CHAIN.seedUrl.replace(/\/[^/]*$/, '')}/${filename}`);
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const o = window.location.origin;
    urls.push(`${o}/docs/kernel/seed/${filename}`);
    urls.push(`${o}/kernel/seed/${filename}`);
    urls.push(`${o}/world/kernel/seed/${filename}`);
    const base = window.location.pathname.replace(/\/[^/]*$/, '');
    urls.push(`${o}${base}/../kernel/seed/${filename}`);
  }
  return [...new Set(urls)];
}

async function fetchJson(filename) {
  for (const url of seedUrls(filename)) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) continue;
      return await res.json();
    } catch (_) {}
  }
  return null;
}

export const githubSeedAdapter = {
  id: 'github-seed',
  tier: 0,
  label: 'GitHub Pages / raw JSON seed',
  _spatial: null,
  _intakeBundle: null,
  _globalBundle: null,
  _demoSalesOrder: null,

  async isAvailable() {
    return typeof fetch !== 'undefined';
  },

  async init() {
    const spatialData = await fetchJson('spatial.json');
    if (Array.isArray(spatialData?.spatial)) this._spatial = spatialData.spatial;

    const intake = await fetchJson('intake-v11.json');
    if (intake?.version === 11) this._intakeBundle = intake;

    const global = await fetchJson('global-v12.json');
    if (global?.version === 12) this._globalBundle = global;

    const demo = await fetchJson('demo-sales-order.json');
    if (demo) this._demoSalesOrder = demo;

    return !!(this._spatial?.length || this._intakeBundle || this._globalBundle || this._demoSalesOrder);
  },

  async listSpatial() {
    const cells = [...(this._spatial || [])];
    for (const c of this._globalBundle?.spatial || []) {
      if (!cells.find((x) => x.id === c.id)) cells.push(c);
    }
    return cells;
  },

  async getSpatial(id) {
    return (await this.listSpatial()).find((c) => c.id === id) || null;
  },

  getDemoSalesOrder() {
    return this._demoSalesOrder;
  },

  getIntakeBundle() {
    return this._intakeBundle;
  },

  getGlobalBundle() {
    return this._globalBundle;
  },
};

/**
 * Tier-0 免费链环：GitHub 静态 JSON（只读种子，全球 CDN）
 * 从本仓库 raw 或同域 docs 拉取初始空间链，零 API Key
 */

export const githubSeedAdapter = {
  id: 'github-seed',
  tier: 0,
  label: 'GitHub Pages / raw JSON seed',
  _spatial: null,

  async isAvailable() {
    return typeof fetch !== 'undefined';
  },

  async init() {
    const bases = [];
    if (typeof window !== 'undefined' && window.LOT_CHAIN?.seedUrl) {
      bases.push(window.LOT_CHAIN.seedUrl);
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      bases.push(window.location.origin + '/kernel/seed/spatial.json');
      bases.push(window.location.origin + '/world/kernel/seed/spatial.json');
    }
    for (const url of bases) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data?.spatial)) {
          this._spatial = data.spatial;
          return true;
        }
      } catch (_) {}
    }
    return false;
  },

  async listSpatial() {
    return this._spatial || [];
  },

  async getSpatial(id) {
    return (this._spatial || []).find((c) => c.id === id) || null;
  },
};

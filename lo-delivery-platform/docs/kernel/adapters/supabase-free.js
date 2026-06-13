/**
 * Tier-1 免费链环：Supabase 免费层（PostgreSQL + Storage + Auth 各 500MB 级）
 * 可选：在页面设置 window.LOT_CHAIN = { supabaseUrl, supabaseAnonKey, tablePrefix: 'lot_' }
 * 未配置时自动跳过，不报错
 */

function cfg() {
  return typeof window !== 'undefined' ? window.LOT_CHAIN || {} : {};
}

async function sbFetch(path, options = {}) {
  const { supabaseUrl, supabaseAnonKey } = cfg();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const url = supabaseUrl.replace(/\/$/, '') + '/rest/v1/' + path;
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: 'Bearer ' + supabaseAnonKey,
    'Content-Type': 'application/json',
    Prefer: options.prefer || 'return=minimal',
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error('supabase ' + res.status);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function tbl(name) {
  const p = cfg().tablePrefix || 'lot_';
  return p + name;
}

export const supabaseFreeAdapter = {
  id: 'supabase-free',
  tier: 1,
  label: 'Supabase Free Tier',

  async isAvailable() {
    const c = cfg();
    return !!(c.supabaseUrl && c.supabaseAnonKey);
  },

  async init() {
    return this.isAvailable();
  },

  async putLO(lo) {
    await sbFetch(tbl('los'), {
      method: 'POST',
      body: JSON.stringify(mapLoToRow(lo)),
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
  },

  async getLO(loId) {
    const rows = await sbFetch(tbl('los') + '?lo_id=eq.' + encodeURIComponent(loId) + '&limit=1');
    return rows?.[0] ? mapLoRow(rows[0]) : null;
  },

  async listLOs() {
    const rows = await sbFetch(tbl('los') + '?order=updated_at.desc');
    return (rows || []).map(mapLoRow);
  },

  async putEvent(evt) {
    await sbFetch(tbl('events'), {
      method: 'POST',
      body: JSON.stringify({
        lo_id: evt.loId,
        seq: evt.seq,
        type: evt.type,
        code: evt.code,
        actor: evt.actor,
        spatial_cell_id: evt.spatialCellId,
        payload: evt.payload,
        ts: evt.ts,
        prev_hash: evt.prevHash,
        hash: evt.hash,
      }),
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
  },

  async getEvents(loId) {
    const rows = await sbFetch(
      tbl('events') + '?lo_id=eq.' + encodeURIComponent(loId) + '&order=seq.asc'
    );
    return (rows || []).map(mapEventRow);
  },
};

function mapLoToRow(lo) {
  return {
    lo_id: lo.loId,
    channel: lo.channel,
    status: lo.status,
    spatial_path: lo.spatialPath,
    origin_cell_id: lo.originCellId,
    dest_cell_id: lo.destCellId,
    primary_actor: lo.primaryActor,
    contract: lo.contract,
    links: lo.links,
    created_at: lo.createdAt,
    updated_at: lo.updatedAt,
  };
}

function mapLoRow(r) {
  return {
    loId: r.lo_id,
    channel: r.channel,
    status: r.status,
    spatialPath: r.spatial_path,
    originCellId: r.origin_cell_id,
    destCellId: r.dest_cell_id,
    primaryActor: r.primary_actor,
    contract: r.contract,
    links: r.links,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapEventRow(r) {
  return {
    loId: r.lo_id,
    seq: r.seq,
    type: r.type,
    code: r.code,
    actor: r.actor,
    spatialCellId: r.spatial_cell_id,
    payload: r.payload,
    ts: r.ts,
    prevHash: r.prev_hash,
    hash: r.hash,
  };
}

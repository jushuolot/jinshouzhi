/**
 * LOT Chain — 免费资源链环编排器
 * 写入：本地 IDB 为主（快、私密）→ 异步复制到 Supabase（可选）
 * 读取：合并本地 + 远程
 * 种子：GitHub 静态 JSON → 写入本地
 */

import { localIdbAdapter } from './adapters/local-idb.js';
import { supabaseFreeAdapter } from './adapters/supabase-free.js';
import { githubSeedAdapter } from './adapters/github-seed.js';
import {
  SEED_LO,
  SEED_SPATIAL_CHAIN,
  appendEventToChain,
  createLO,
} from './lot-nucleus.js';

export class LotChain {
  constructor(adapters) {
    this.adapters = adapters || [localIdbAdapter, githubSeedAdapter, supabaseFreeAdapter];
    this.local = localIdbAdapter;
    this.remote = null;
    this.seed = githubSeedAdapter;
  }

  async init() {
    const status = [];
    for (const a of this.adapters) {
      try {
        if (await a.isAvailable()) {
          await a.init();
          status.push({ id: a.id, tier: a.tier, ok: true, label: a.label });
          if (a.tier >= 1 && a.id === 'supabase-free') this.remote = a;
        } else {
          status.push({ id: a.id, tier: a.tier, ok: false, label: a.label });
        }
      } catch (e) {
        status.push({ id: a.id, tier: a.tier, ok: false, label: a.label, err: String(e.message || e) });
      }
    }
    await this._ensureSeed();
    this._status = status;
    return status;
  }

  getChainStatus() {
    return this._status || [];
  }

  async _ensureSeed() {
    const seeded = await this.local.getMeta('nucleus_seeded');
    if (seeded) return;

    let spatial = SEED_SPATIAL_CHAIN;
    if (await this.seed.isAvailable()) {
      await this.seed.init();
      const remote = await this.seed.listSpatial();
      if (remote.length) spatial = remote;
    }
    await this.local.putSpatial(spatial);

    const los = await this.local.listLOs();
    if (!los.length) {
      await this.local.putLO(SEED_LO);
      const events = await appendEventToChain([], {
        loId: SEED_LO.loId,
        type: 'FACT',
        code: 'ORDER_CREATED',
        actor: 'shipper',
        spatialCellId: SEED_LO.originCellId,
        payload: { msg: '农户微信下单，进入核心里程碑' },
      });
      for (const e of events) await this.local.putEvent(e);
    }
    await this.local.setMeta('nucleus_seeded', new Date().toISOString());
  }

  async listLOs() {
    return this.local.listLOs();
  }

  async getLO(loId) {
    return this.local.getLO(loId);
  }

  async getEvents(loId) {
    return this.local.getEvents(loId);
  }

  async listSpatial() {
    return this.local.listSpatial();
  }

  async getSpatialPath(fromId) {
    const all = await this.local.listSpatial();
    const map = new Map(all.map((c) => [c.id, c]));
    const path = [];
    let cur = map.get(fromId);
    while (cur) {
      path.unshift(cur);
      cur = cur.parentId ? map.get(cur.parentId) : null;
    }
    return path;
  }

  async createLO(partial) {
    const lo = createLO(partial);
    await this.local.putLO(lo);
    await this._replicateLO(lo);
    const events = await appendEventToChain([], {
      loId: lo.loId,
      type: 'FACT',
      code: 'ORDER_CREATED',
      actor: partial.primaryActor || 'shipper',
      spatialCellId: lo.originCellId,
      payload: partial.bootstrapPayload || {},
    });
    for (const e of events) await this.appendEvent(e);
    return lo;
  }

  async appendEvent(evt) {
    await this.local.putEvent(evt);
    if (this.remote) {
      try {
        await this.remote.putEvent(evt);
      } catch (_) {}
    }
    const lo = await this.local.getLO(evt.loId);
    if (lo) {
      lo.updatedAt = new Date().toISOString();
      await this.local.putLO(lo);
      await this._replicateLO(lo);
    }
    return evt;
  }

  async emitAction(loId, { code, actor, spatialCellId, type = 'FACT', payload = {} }) {
    const events = await this.local.getEvents(loId);
    const next = await appendEventToChain(events, {
      loId,
      type,
      code,
      actor,
      spatialCellId,
      payload,
    });
    const evt = next[next.length - 1];
    return this.appendEvent(evt);
  }

  async _replicateLO(lo) {
    if (!this.remote) return;
    try {
      await this.remote.putLO(lo);
    } catch (_) {}
  }

  async pullRemote(loId) {
    if (!this.remote) return false;
    try {
      const remoteEvents = await this.remote.getEvents(loId);
      const localEvents = await this.local.getEvents(loId);
      const localSeq = new Set(localEvents.map((e) => e.seq));
      for (const e of remoteEvents) {
        if (!localSeq.has(e.seq)) await this.local.putEvent(e);
      }
      const remoteLo = await this.remote.getLO(loId);
      if (remoteLo) await this.local.putLO(remoteLo);
      return true;
    } catch (_) {
      return false;
    }
  }
}

export const defaultChain = new LotChain();

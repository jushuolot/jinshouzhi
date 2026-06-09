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
  SEED_NETWORK_LOS,
  SEED_SPATIAL_CHAIN,
  appendEventToChain,
  createLO,
} from './lot-nucleus.js';
import { maybePropagate } from './lot-network.js';
import {
  DEMO_DOMAIN_LOS_V3,
  DEMO_DOMAIN_LOS_V4,
  DEMO_EVENT_HISTORIES_V3,
  DEMO_EVENT_HISTORIES_V4,
  DEMO_SPATIAL_EXT,
  DEMO_SPATIAL_V4,
} from './lot-demo-data.js';
import { DEMO_DOMAIN_LOS_V5, DEMO_EVENT_HISTORIES_V5, DEMO_SPATIAL_V5 } from './lot-demo-data-warehouse.js';
import { DEMO_EQUIPMENT, bumpEquipmentOnEvent, aggregateOrders, splitOrder } from './lot-warehouse.js';

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
    if (seeded) {
      await this._ensureNetworkSeed();
      await this._ensureDomainsSeed();
      await this._ensureDomainsV4Seed();
      await this._ensureWarehouseV5Seed();
      return;
    }

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
    await this._ensureNetworkSeed();
    await this._ensureDomainsSeed();
    await this._ensureDomainsV4Seed();
    await this._ensureWarehouseV5Seed();
    await this.local.setMeta('nucleus_seeded', new Date().toISOString());
  }

  async _ensureNetworkSeed() {
    const v2 = await this.local.getMeta('network_v2_seeded');
    if (v2) return;
    for (const lo of SEED_NETWORK_LOS) {
      const existing = await this.local.getLO(lo.loId);
      if (existing) continue;
      await this.local.putLO(lo);
      const events = await appendEventToChain([], {
        loId: lo.loId,
        type: 'FACT',
        code: 'ORDER_CREATED',
        actor: lo.primaryActor,
        spatialCellId: lo.originCellId,
        payload: { msg: '供应链裂变种子', channel: lo.channel },
      });
      for (const e of events) {
        await this.local.putEvent(e);
        if (this.remote) {
          try {
            await this.remote.putEvent(e);
          } catch (_) {}
        }
      }
      await this._replicateLO(lo);
    }
    await this.local.setMeta('network_v2_seeded', new Date().toISOString());
  }

  async _ensureDomainsSeed() {
    const v3 = await this.local.getMeta('domains_v3_seeded');
    if (v3) return;
    await this.local.putSpatial(DEMO_SPATIAL_EXT);
    for (const lo of DEMO_DOMAIN_LOS_V3) {
      const existing = await this.local.getLO(lo.loId);
      if (existing) continue;
      await this.local.putLO(lo);
      const partials = DEMO_EVENT_HISTORIES_V3.get(lo.loId) || [];
      let chain = [];
      for (const p of partials) {
        chain = await appendEventToChain(chain, { loId: lo.loId, ...p });
      }
      for (const e of chain) {
        await this.local.putEvent(e);
        if (this.remote) {
          try {
            await this.remote.putEvent(e);
          } catch (_) {}
        }
      }
      await this._replicateLO(lo);
    }
    await this.local.setMeta('domains_v3_seeded', new Date().toISOString());
  }

  async _ensureDomainsV4Seed() {
    const v4 = await this.local.getMeta('domains_v4_seeded');
    if (v4) return;
    await this.local.putSpatial(DEMO_SPATIAL_V4);
    for (const lo of DEMO_DOMAIN_LOS_V4) {
      const existing = await this.local.getLO(lo.loId);
      if (existing) continue;
      await this.local.putLO(lo);
      const partials = DEMO_EVENT_HISTORIES_V4.get(lo.loId) || [];
      let chain = [];
      for (const p of partials) {
        chain = await appendEventToChain(chain, { loId: lo.loId, ...p });
      }
      for (const e of chain) {
        await this.local.putEvent(e);
        if (this.remote) {
          try {
            await this.remote.putEvent(e);
          } catch (_) {}
        }
      }
      await this._replicateLO(lo);
    }
    const line = await this.local.getLO('LO-LINE-001');
    if (line && line.logisticsDomain !== 'linehaul') {
      line.logisticsDomain = 'linehaul';
      await this.local.putLO(line);
    }
    await this.local.setMeta('domains_v4_seeded', new Date().toISOString());
  }

  async _ensureWarehouseV5Seed() {
    const v5 = await this.local.getMeta('warehouse_v5_seeded');
    if (v5) return;
    await this.local.putSpatial(DEMO_SPATIAL_V5);
    for (const lo of DEMO_DOMAIN_LOS_V5) {
      const existing = await this.local.getLO(lo.loId);
      if (existing) continue;
      await this.local.putLO(lo);
      const partials = DEMO_EVENT_HISTORIES_V5.get(lo.loId) || [];
      let chain = [];
      for (const p of partials) {
        chain = await appendEventToChain(chain, { loId: lo.loId, ...p });
      }
      for (const e of chain) {
        await this.local.putEvent(e);
        if (this.remote) {
          try {
            await this.remote.putEvent(e);
          } catch (_) {}
        }
      }
      await this._replicateLO(lo);
    }
    await this.setEquipment(DEMO_EQUIPMENT);
    await this.local.setMeta('warehouse_v5_seeded', new Date().toISOString());
  }

  async putLODirect(lo) {
    await this.local.putLO(lo);
    await this._replicateLO(lo);
    return lo;
  }

  async getEquipment() {
    const raw = await this.local.getMeta('equipment_fleet');
    if (!raw) return [...DEMO_EQUIPMENT];
    try {
      return JSON.parse(raw);
    } catch {
      return [...DEMO_EQUIPMENT];
    }
  }

  async setEquipment(list) {
    await this.local.setMeta('equipment_fleet', JSON.stringify(list));
  }

  async runAggregateDemo() {
    return aggregateOrders(this, {
      parentLoId: 'LO-AGG-DEMO-' + Date.now(),
      childLoIds: ['LO-ECM-004', 'LO-ECM-005', 'LO-ECM-006'],
      tier: 'rdc',
      facilityId: 'bj-rdc-tongzhou',
      cargo: '动态聚合演示波次',
    });
  }

  async runSplitDemo() {
    const parent = await this.createLO({
      loId: 'LO-SPLIT-DEMO-' + Date.now(),
      logisticsDomain: 'warehouse_internal',
      facilityTier: 'dc',
      channel: 'split-demo',
      originCellId: 'bj-dc-shunyi',
      destCellId: 'bj-daxing-port',
      contract: { cargo: '动态拆分演示母单', tier: 'dc' },
    });
    return splitOrder(this, parent.loId, [
      { loId: parent.loId + '-A', cargo: '拆分子单 A', destCellId: 'bj-langfang-terminal' },
      { loId: parent.loId + '-B', cargo: '拆分子单 B', destCellId: 'bj-express-hub' },
    ]);
  }

  async listLOs(filter = {}) {
    let los = await this.local.listLOs();
    if (filter.domain) {
      los = los.filter((lo) => (lo.logisticsDomain || lo.channel) === filter.domain);
    }
    if (filter.tier) {
      los = los.filter((lo) => lo.facilityTier === filter.tier);
    }
    if (filter.status) {
      los = los.filter((lo) => lo.status === filter.status);
    }
    return los;
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
    const saved = await this.appendEvent(evt);
    await maybePropagate(this, loId, code);
    const lo = await this.getLO(loId);
    if (lo?.logisticsDomain === 'warehouse_internal' || lo?.facilityTier) {
      const eq = await this.getEquipment();
      const next = bumpEquipmentOnEvent(eq, code, lo.originCellId);
      await this.setEquipment(next);
    }
    return saved;
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
      if (loId) {
        await this._pullOneLO(loId);
        return true;
      }
      const remoteLos = await this.remote.listLOs();
      for (const rlo of remoteLos || []) await this._pullOneLO(rlo.loId);
      return true;
    } catch (_) {
      return false;
    }
  }

  async _pullOneLO(loId) {
    const remoteEvents = await this.remote.getEvents(loId);
    const localEvents = await this.local.getEvents(loId);
    const localSeq = new Set(localEvents.map((e) => e.seq));
    for (const e of remoteEvents) {
      if (!localSeq.has(e.seq)) await this.local.putEvent(e);
    }
    const remoteLo = await this.remote.getLO(loId);
    if (remoteLo) await this.local.putLO(remoteLo);
  }

  /** 重置本机演示数据并重新裂变种子 */
  async resetDemo() {
    await this.local.init();
    const db = this.local._db;
    if (db) {
      for (const name of ['los', 'events', 'spatial', 'meta']) {
        await new Promise((res, rej) => {
          const r = db.transaction(name, 'readwrite').objectStore(name).clear();
          r.onsuccess = () => res();
          r.onerror = () => rej(r.error);
        });
      }
    }
    await this._ensureSeed();
  }
}

export const defaultChain = new LotChain();

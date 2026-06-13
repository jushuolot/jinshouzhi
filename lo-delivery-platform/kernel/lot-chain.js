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
  createChainLink,
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
import { CROSS_LINKS_V6 } from './lot-evolve.js';
import { DEMO_DOMAIN_LOS_V7, DEMO_EVENT_HISTORIES_V7 } from './lot-demo-data-tender.js';
import { DEMO_DOCUMENTS } from './lot-demo-data-docs.js';
import { propagateAward } from './lot-tender.js';
import { domainsForSubsystem } from './lot-org.js';
import { docMatchesSubsystem } from './lot-documents.js';
import {
  DEMO_CHAIN_ORDER,
  DEMO_CHAIN_ORDER_SETTLING,
  DEMO_ECO_LOS,
  DEMO_ECO_EVENTS,
  DEMO_SETTLEMENTS,
} from './lot-demo-data-eco.js';
import {
  DEMO_INTAKE_DRAFT_ORDER,
  DEMO_INTAKE_FLOW_ORDER,
  DEMO_INTAKE_LOS,
  DEMO_INTAKE_EVENTS,
  DEMO_INTAKE_DOCUMENTS,
  ECO_SALES_FLOW_PREFIX,
} from './lot-demo-data-intake.js';
import {
  DEMO_SPATIAL_GLOBAL,
  DEMO_GLOBAL_SEA_ORDER,
  DEMO_GLOBAL_COLD_ORDER,
  DEMO_GLOBAL_LOS,
  DEMO_GLOBAL_EVENTS,
  DEMO_GLOBAL_DOCUMENTS,
  DEMO_GLOBAL_ROUTES,
} from './lot-demo-data-global.js';
import {
  DEMO_SPATIAL_TWIN,
  DEMO_TWIN_SNAPSHOTS,
  DEMO_TWIN_POLICIES,
} from './lot-demo-data-twin.js';
import { computeControlTower } from './lot-control-tower.js';
import {
  getPendingOperation,
  executePendingOperation,
  isAutoPilot,
  setAutoPilot,
} from './lot-operations.js';
import { applyDocumentAction, getDocumentActions } from './lot-document-ops.js';
import { runSeedEvolution, reportSeedStatus, PLATFORM_VERSION } from './lot-seed-evolve.js';
import { projectChainOrder as computeChainProjection, syncChainOrderOnEvent } from './lot-chain-order.js';
import { defaultPeerSettlements } from './lot-settlement.js';
import {
  onBusinessEvent,
  advanceChainOrderStep,
  getNextBusinessStep,
  describeStageBlock,
  getShipperOrderFlowView,
  advanceShipperOrderFlow,
  createChainFromIntake,
  createChainFromSales,
  docsForChainOrder,
  advanceSettlement,
  runBusinessEvolutionTick,
} from './lot-business.js';

export { PLATFORM_VERSION };

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
      await this._ensureEvolveV6Seed();
      await this._ensureTenderV7Seed();
      await this._ensureDocsV8Seed();
      await this._ensureEcoV9Seed();
      await this._ensureTwinV10Seed();
      await this._ensureIntakeV11Seed();
      await this._ensureGlobalV12Seed();
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
    await this._ensureEvolveV6Seed();
    await this._ensureTenderV7Seed();
    await this._ensureDocsV8Seed();
    await this._ensureEcoV9Seed();
    await this._ensureTwinV10Seed();
    await this._ensureIntakeV11Seed();
    await this._ensureGlobalV12Seed();
    await this.local.setMeta('nucleus_seeded', new Date().toISOString());
  }

  async _ensureTwinV10Seed() {
    const v10 = await this.local.getMeta('twin_v10_seeded');
    if (v10) return;
    const allSpatial = await this.local.listSpatial();
    const ids = new Set(allSpatial.map((c) => c.id));
    const toAdd = DEMO_SPATIAL_GLOBAL.filter((c) => !ids.has(c.id));
    if (toAdd.length) await this.local.putSpatial(toAdd);
    await this.local.setMeta('twin_facilities', JSON.stringify(DEMO_SPATIAL_TWIN));
    await this.local.setMeta('twin_snapshots', JSON.stringify(DEMO_TWIN_SNAPSHOTS));
    await this.local.setMeta('twin_policies', JSON.stringify(DEMO_TWIN_POLICIES));
    await this.local.setMeta('twin_v10_seeded', new Date().toISOString());
  }

  async _ensureGlobalV12Seed() {
    const v12 = await this.local.getMeta('global_v12_seeded');
    if (v12) return;

    const allSpatial = await this.local.listSpatial();
    const ids = new Set(allSpatial.map((c) => c.id));
    const toAdd = DEMO_SPATIAL_GLOBAL.filter((c) => !ids.has(c.id));
    if (toAdd.length) await this.local.putSpatial(toAdd);

    for (const co of [DEMO_GLOBAL_SEA_ORDER, DEMO_GLOBAL_COLD_ORDER]) {
      if (!(await this.local.getChainOrder(co.chainOrderId))) await this.local.putChainOrder(co);
    }
    for (const lo of DEMO_GLOBAL_LOS) {
      if (await this.local.getLO(lo.loId)) continue;
      await this.local.putLO(lo);
      const partials = DEMO_GLOBAL_EVENTS.get(lo.loId) || [];
      let chain = [];
      for (const p of partials) {
        chain = await appendEventToChain(chain, { loId: lo.loId, ...p });
      }
      for (const e of chain) await this.local.putEvent(e);
    }
    for (const doc of DEMO_GLOBAL_DOCUMENTS) {
      if (!(await this.local.getDocument(doc.docId))) await this.local.putDocument(doc);
    }
    await this.local.setMeta('global_routes', JSON.stringify(DEMO_GLOBAL_ROUTES));
    await this.local.setMeta('global_v12_seeded', new Date().toISOString());
    await this.local.setMeta('platform_version', PLATFORM_VERSION);
  }

  async _mergeRemoteGlobalBundle() {
    const bundle = this.seed?._globalBundle;
    if (!bundle || bundle.version !== 12) return;
    if (bundle.spatial?.length) {
      const ids = new Set((await this.local.listSpatial()).map((c) => c.id));
      const add = bundle.spatial.filter((c) => !ids.has(c.id));
      if (add.length) await this.local.putSpatial(add);
    }
    for (const co of bundle.chainOrders || []) {
      if (!(await this.local.getChainOrder(co.chainOrderId))) await this.local.putChainOrder(co);
    }
  }

  async getGlobalRoutes() {
    const raw = await this.local.getMeta('global_routes');
    return raw ? JSON.parse(raw) : DEMO_GLOBAL_ROUTES;
  }

  async getControlTower(opts) {
    return computeControlTower(this, opts);
  }

  async _ensureIntakeV11Seed() {
    const v11 = await this.local.getMeta('intake_v11_seeded');
    if (v11) return;

    await this._retrofitEcoSalesFlow();

    for (const co of [DEMO_INTAKE_DRAFT_ORDER, DEMO_INTAKE_FLOW_ORDER]) {
      if (!(await this.local.getChainOrder(co.chainOrderId))) {
        await this.local.putChainOrder(co);
      }
    }
    for (const lo of DEMO_INTAKE_LOS) {
      if (await this.local.getLO(lo.loId)) continue;
      await this.local.putLO(lo);
      const partials = DEMO_INTAKE_EVENTS.get(lo.loId) || [];
      let chain = [];
      for (const p of partials) {
        chain = await appendEventToChain(chain, { loId: lo.loId, ...p });
      }
      for (const e of chain) await this.local.putEvent(e);
    }
    for (const doc of DEMO_INTAKE_DOCUMENTS) {
      if (await this.local.getDocument(doc.docId)) continue;
      await this.local.putDocument(doc);
    }

    const eco = await this.local.getChainOrder(DEMO_CHAIN_ORDER.chainOrderId);
    if (eco) {
      eco.orderLines = eco.orderLines?.length ? eco.orderLines : DEMO_CHAIN_ORDER.orderLines;
      eco.intakeSource = eco.intakeSource || DEMO_CHAIN_ORDER.intakeSource;
      eco.consignee = eco.consignee || DEMO_CHAIN_ORDER.consignee;
      eco.salesFlowComplete = true;
      await this.local.putChainOrder(eco);
    }

    await this.local.setMeta('intake_v11_seeded', new Date().toISOString());
  }

  /** 将 v9 主单销售 LO 事件链补齐五步货主流程（保留后续履约事件） */
  async _retrofitEcoSalesFlow() {
    const loId = 'LO-SAL-2024-ECO-001';
    const lo = await this.local.getLO(loId);
    if (!lo) return;
    const existing = await this.local.getEvents(loId);
    if (!existing.length || existing.some((e) => e.code === 'SO_DRAFT')) return;

    const prefixCodes = new Set(ECO_SALES_FLOW_PREFIX.map((p) => p.code));
    const tail = existing.filter((e) => !prefixCodes.has(e.code));
    let chain = [];
    for (const p of [
      ...ECO_SALES_FLOW_PREFIX,
      ...tail.map((e) => ({
        type: e.type,
        code: e.code,
        actor: e.actor,
        spatialCellId: e.spatialCellId,
        payload: e.payload,
      })),
    ]) {
      chain = await appendEventToChain(chain, { loId, ...p });
    }
    const db = this.local._db;
    if (db) {
      await new Promise((res, rej) => {
        const idx = db.transaction('events', 'readwrite').objectStore('events').index('loId_seq');
        const range = IDBKeyRange.bound([loId, 0], [loId, Infinity]);
        const req = idx.openCursor(range);
        req.onsuccess = (ev) => {
          const cur = ev.target.result;
          if (cur) {
            cur.delete();
            cur.continue();
          } else res();
        };
        req.onerror = () => rej(req.error);
      });
    }
    for (const e of chain) await this.local.putEvent(e);
  }

  async _mergeRemoteIntakeBundle() {
    const bundle = this.seed?._intakeBundle;
    if (!bundle) return;
    for (const co of bundle.chainOrders || []) {
      if (!(await this.local.getChainOrder(co.chainOrderId))) await this.local.putChainOrder(co);
    }
    for (const lo of bundle.los || []) {
      if (await this.local.getLO(lo.loId)) continue;
      await this.local.putLO(lo);
    }
    for (const row of bundle.events || []) {
      const ev = await this.local.getEvents(row.loId);
      if (ev.some((e) => e.code === row.code)) continue;
      const chain = await appendEventToChain(ev, {
        loId: row.loId,
        type: row.type || 'FACT',
        code: row.code,
        actor: row.actor,
        spatialCellId: row.spatialCellId,
        payload: row.payload,
      });
      const last = chain[chain.length - 1];
      if (last) await this.local.putEvent(last);
    }
    for (const doc of bundle.documents || []) {
      if (!(await this.local.getDocument(doc.docId))) await this.local.putDocument(doc);
    }
  }

  async evolveSeed() {
    return runSeedEvolution(this);
  }

  async getSeedStatus() {
    return reportSeedStatus(this);
  }

  async getShipperFlow(chainOrderId) {
    return getShipperOrderFlowView(this, chainOrderId);
  }

  async advanceShipperFlow(chainOrderId, opts) {
    return advanceShipperOrderFlow(this, chainOrderId, opts);
  }

  async getPendingOperation(chainOrderId, viewerActor) {
    return getPendingOperation(this, chainOrderId, viewerActor);
  }

  async executeOperation(chainOrderId, viewerActor) {
    return executePendingOperation(this, chainOrderId, viewerActor);
  }

  async getDocumentActions(docId, viewerActor) {
    const doc = await this.getDocument(docId);
    return getDocumentActions(doc, viewerActor);
  }

  async applyDocumentAction(docId, actionId, viewerActor) {
    return applyDocumentAction(this, docId, actionId, viewerActor);
  }

  async getAutoPilot() {
    return isAutoPilot(this);
  }

  async setAutoPilot(on) {
    return setAutoPilot(this, on);
  }

  async createChainFromIntake(intake) {
    return createChainFromIntake(this, intake);
  }

  async getDocumentsForChain(chainOrderId) {
    return docsForChainOrder(this, chainOrderId);
  }

  async _ensureEcoV9Seed() {
    const v9 = await this.local.getMeta('eco_v9_seeded');
    if (v9) return;
    for (const co of [DEMO_CHAIN_ORDER, DEMO_CHAIN_ORDER_SETTLING]) {
      if (!(await this.local.getChainOrder(co.chainOrderId))) {
        await this.local.putChainOrder(co);
      }
    }
    for (const lo of DEMO_ECO_LOS) {
      if (await this.local.getLO(lo.loId)) continue;
      await this.local.putLO(lo);
      const partials = DEMO_ECO_EVENTS.get(lo.loId) || [];
      let chain = [];
      for (const p of partials) {
        chain = await appendEventToChain(chain, { loId: lo.loId, ...p });
      }
      for (const e of chain) await this.local.putEvent(e);
    }
    for (const stl of DEMO_SETTLEMENTS) {
      if (!(await this.local.getChainOrder(stl.chainOrderId))) continue;
      const exists = (await this.local.listSettlements()).some((s) => s.settlementId === stl.settlementId);
      if (!exists) await this.local.putSettlement(stl);
    }
    await this.local.setMeta('eco_v9_seeded', new Date().toISOString());
  }

  async _ensureDocsV8Seed() {
    const v8 = await this.local.getMeta('docs_v8_seeded');
    if (v8) return;
    for (const doc of DEMO_DOCUMENTS) {
      const existing = await this.local.getDocument(doc.docId);
      if (existing) continue;
      await this.local.putDocument(doc);
    }
    await this.local.setMeta('docs_v8_seeded', new Date().toISOString());
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

  async _ensureEvolveV6Seed() {
    const v6 = await this.local.getMeta('evolve_v6_seeded');
    if (v6) return;
    for (const l of CROSS_LINKS_V6) {
      const lo = await this.local.getLO(l.from);
      if (!lo) continue;
      lo.links = lo.links || [];
      if (!lo.links.some((x) => x.targetLoId === l.to)) {
        lo.links.push(createChainLink({ rel: 'downstream', targetLoId: l.to, label: l.label }));
        await this.local.putLO(lo);
      }
    }
    if (!(await this.local.getMeta('fission_generation'))) {
      await this.local.setMeta('fission_generation', '1');
    }
    await this.local.setMeta('evolve_v6_seeded', new Date().toISOString());
  }

  async _ensureTenderV7Seed() {
    const v7 = await this.local.getMeta('tender_v7_seeded');
    if (v7) return;
    for (const lo of DEMO_DOMAIN_LOS_V7) {
      const existing = await this.local.getLO(lo.loId);
      if (existing) continue;
      await this.local.putLO(lo);
      const partials = DEMO_EVENT_HISTORIES_V7.get(lo.loId) || [];
      let chain = [];
      for (const p of partials) {
        chain = await appendEventToChain(chain, { loId: lo.loId, ...p });
      }
      for (const e of chain) {
        await this.local.putEvent(e);
      }
      await this._replicateLO(lo);
    }
    await this.local.setMeta('tender_v7_seeded', new Date().toISOString());
  }

  async getFissionGeneration() {
    const v = await this.local.getMeta('fission_generation');
    return parseInt(v || '1', 10) || 1;
  }

  async setFissionGeneration(n) {
    await this.local.setMeta('fission_generation', String(n));
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
    if (filter.subsystem && filter.subsystem !== 'all') {
      const domains = domainsForSubsystem(filter.subsystem);
      if (domains?.length) {
        los = los.filter((lo) => domains.includes(lo.logisticsDomain || lo.channel));
      }
    }
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

  async listDocuments(filter = {}) {
    let docs = await this.local.listDocuments();
    if (filter.loId) docs = docs.filter((d) => d.loId === filter.loId);
    if (filter.subsystem && filter.subsystem !== 'all') {
      docs = docs.filter((d) => docMatchesSubsystem(d, filter.subsystem));
    }
    if (filter.docType) docs = docs.filter((d) => d.docType === filter.docType);
    return docs;
  }

  async getDocument(docId) {
    return this.local.getDocument(docId);
  }

  async putChainOrder(co) {
    await this.local.putChainOrder(co);
    return co;
  }

  async getChainOrder(chainOrderId) {
    return this.local.getChainOrder(chainOrderId);
  }

  async listChainOrders(filter = {}) {
    let rows = await this.local.listChainOrders();
    if (filter.viewerEnterpriseId) {
      const vid = filter.viewerEnterpriseId;
      rows = rows.filter((co) => {
        if (co.anchorEnterpriseId === vid) return true;
        return (co.participants || []).some((p) => p.enterpriseId === vid);
      });
    }
    if (filter.status) rows = rows.filter((co) => co.status === filter.status);
    return rows.sort((a, b) => (b.lastEventAt || '').localeCompare(a.lastEventAt || ''));
  }

  async getChainOrderView(chainOrderId) {
    const co = await this.getChainOrder(chainOrderId);
    if (!co) return null;
    return computeChainProjection(this, co);
  }

  async listSettlements(filter = {}) {
    let rows = await this.local.listSettlements();
    if (filter.chainOrderId) rows = rows.filter((s) => s.chainOrderId === filter.chainOrderId);
    if (filter.viewerEnterpriseId) {
      const vid = filter.viewerEnterpriseId;
      rows = rows.filter((s) => s.payerEnterpriseId === vid || s.payeeEnterpriseId === vid);
    }
    return rows;
  }

  async spawnPeerSettlements(chainOrderId, triggerLoId) {
    const co = await this.getChainOrder(chainOrderId);
    if (!co) return [];
    const projected = await computeChainProjection(this, co);
    const existing = await this.listSettlements({ chainOrderId });
    if (existing.length) return existing;
    const stls = defaultPeerSettlements(chainOrderId, co.anchorEnterpriseId, projected.legs);
    for (const s of stls) {
      s.legLoId = s.legLoId || triggerLoId;
      await this.local.putSettlement(s);
    }
    co.status = 'settling';
    await this.putChainOrder(co);
    return stls;
  }

  async getDocumentsForLo(loId) {
    const direct = await this.local.listDocumentsByLo(loId);
    const all = await this.local.listDocuments();
    const linked = all.filter((d) => d.links?.some((l) => l.loId === loId));
    const map = new Map();
    for (const d of [...direct, ...linked]) map.set(d.docId, d);
    return [...map.values()];
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
    if (lo?.logisticsDomain === 'tender' && code === 'KICKOFF_SYNC') {
      await propagateAward(this, loId);
    }
    if (lo?.logisticsDomain === 'warehouse_internal' || lo?.facilityTier) {
      const eq = await this.getEquipment();
      const next = bumpEquipmentOnEvent(eq, code, lo.originCellId);
      await this.setEquipment(next);
    }
    if (lo?.chainOrderId) {
      await syncChainOrderOnEvent(this, loId, code);
      await onBusinessEvent(this, loId, code);
    }
    return saved;
  }

  async getNextStep(chainOrderId) {
    return getNextBusinessStep(this, chainOrderId);
  }

  async getStageBlock(chainOrderId) {
    return describeStageBlock(this, chainOrderId);
  }

  async advanceChain(chainOrderId) {
    return advanceChainOrderStep(this, chainOrderId);
  }

  async createChainFromSales(partial) {
    return createChainFromSales(this, partial);
  }

  async advanceSettlementStatus(settlementId, action) {
    return advanceSettlement(this, settlementId, action);
  }

  async runEvolutionTick(opts) {
    return runBusinessEvolutionTick(this, opts);
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
      for (const name of ['los', 'events', 'spatial', 'meta', 'documents', 'chain_orders', 'settlements']) {
        await new Promise((res, rej) => {
          const r = db.transaction(name, 'readwrite').objectStore(name).clear();
          r.onsuccess = () => res();
          r.onerror = () => rej(r.error);
        });
      }
    }
    await this._ensureSeed();
    return this.getSeedStatus();
  }
}

export const defaultChain = new LotChain();

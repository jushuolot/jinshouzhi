/**
 * LOT Nucleus — 物流原子核
 * 一个 LO = 质子；事件 = 轨道电子；链环 = 上下游键
 * 零依赖，可嵌入任意壳（world / legacy demo / 未来 SCM）
 */

export const SPATIAL_LEVELS = [
  'universe',
  'planet',
  'region',
  'nation',
  'corridor',
  'metro',
  'city',
  'hub',
  'facility',
  'zone',
  'cell',
];

export const EVENT_TYPES = {
  FACT: 'FACT',
  DECISION: 'DECISION',
  EXCEPTION: 'EXCEPTION',
  FINANCE: 'FINANCE',
  SYNC: 'SYNC',
};

const GENESIS_HASH = '0'.repeat(64);

export function spatialLevelIndex(level) {
  const i = SPATIAL_LEVELS.indexOf(level);
  return i < 0 ? SPATIAL_LEVELS.length - 1 : i;
}

export function createSpatialCell(partial) {
  return {
    id: partial.id,
    level: partial.level || 'city',
    parentId: partial.parentId ?? null,
    labelZh: partial.labelZh || partial.id,
    labelEn: partial.labelEn || partial.id,
    lat: partial.lat ?? null,
    lng: partial.lng ?? null,
    meta: partial.meta || {},
  };
}

/** 预置免费可用的空间链：宇宙 → 地球 → 亚 → 中国 → 京津冀 → 北京 → 枢纽 */
export const SEED_SPATIAL_CHAIN = [
  createSpatialCell({ id: 'universe', level: 'universe', labelZh: '宇宙', labelEn: 'Universe' }),
  createSpatialCell({ id: 'earth', level: 'planet', parentId: 'universe', labelZh: '地球', labelEn: 'Earth' }),
  createSpatialCell({ id: 'asia', level: 'region', parentId: 'earth', labelZh: '亚洲', labelEn: 'Asia' }),
  createSpatialCell({ id: 'cn', level: 'nation', parentId: 'asia', labelZh: '中国', labelEn: 'China', lat: 35.86, lng: 104.19 }),
  createSpatialCell({ id: 'jjj', level: 'corridor', parentId: 'cn', labelZh: '京津冀', labelEn: 'Jing-Jin-Ji', lat: 39.5, lng: 116.4 }),
  createSpatialCell({ id: 'beijing', level: 'metro', parentId: 'jjj', labelZh: '北京', labelEn: 'Beijing', lat: 39.904, lng: 116.407 }),
  createSpatialCell({ id: 'bj-west-hub', level: 'hub', parentId: 'beijing', labelZh: '西站枢纽', labelEn: 'West Station Hub', lat: 39.894, lng: 116.322 }),
  createSpatialCell({ id: 'bj-shunyi-wh', level: 'facility', parentId: 'beijing', labelZh: '顺义仓', labelEn: 'Shunyi WH', lat: 40.13, lng: 116.65 }),
  createSpatialCell({ id: 'bj-yanqing-cell', level: 'cell', parentId: 'beijing', labelZh: '延庆乡村点', labelEn: 'Yanqing Village', lat: 40.45, lng: 115.97 }),
];

export function createLO(partial) {
  const now = new Date().toISOString();
  return {
    loId: partial.loId,
    channel: partial.channel || 'demo',
    status: partial.status || 'active',
    spatialPath: partial.spatialPath || ['earth', 'cn', 'beijing'],
    originCellId: partial.originCellId || 'bj-yanqing-cell',
    destCellId: partial.destCellId || 'bj-west-hub',
    primaryActor: partial.primaryActor || 'driver',
    contract: partial.contract || { slaHours: 24, service: 'standard' },
    links: partial.links || [],
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
  };
}

export function createChainLink(partial) {
  return {
    rel: partial.rel,
    targetLoId: partial.targetLoId || null,
    externalRef: partial.externalRef || null,
    label: partial.label || '',
  };
}

async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sealEvent(partial, prevHash = GENESIS_HASH) {
  const body = {
    loId: partial.loId,
    seq: partial.seq,
    type: partial.type || EVENT_TYPES.FACT,
    code: partial.code,
    actor: partial.actor || 'system',
    spatialCellId: partial.spatialCellId || null,
    payload: partial.payload || {},
    ts: partial.ts || new Date().toISOString(),
    prevHash,
  };
  const canonical = JSON.stringify({
    loId: body.loId,
    seq: body.seq,
    type: body.type,
    code: body.code,
    actor: body.actor,
    spatialCellId: body.spatialCellId,
    payload: body.payload,
    ts: body.ts,
    prevHash: body.prevHash,
  });
  const hash = await sha256Hex(canonical);
  return { ...body, hash };
}

export async function appendEventToChain(events, partial) {
  const prev = events.length ? events[events.length - 1].hash : GENESIS_HASH;
  const seq = events.length ? events[events.length - 1].seq + 1 : 1;
  const evt = await sealEvent({ ...partial, seq }, prev);
  return [...events, evt];
}

export function verifyEventChain(events) {
  if (!events.length) return { ok: true, brokenAt: -1 };
  let prev = GENESIS_HASH;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.prevHash !== prev) return { ok: false, brokenAt: i, reason: 'prevHash mismatch' };
    if (e.seq !== i + 1) return { ok: false, brokenAt: i, reason: 'seq gap' };
    prev = e.hash;
  }
  return { ok: true, brokenAt: -1 };
}

/** 从事件投影 LO 态势（裂变生长的第一片叶子） */
export function projectLOState(lo, events) {
  const last = events[events.length - 1];
  const stageCodes = events.filter((e) => e.type === EVENT_TYPES.FACT).map((e) => e.code);
  const exceptions = events.filter((e) => e.type === EVENT_TYPES.EXCEPTION);
  const progress = Math.min(100, Math.round((stageCodes.length / 8) * 100));
  return {
    loId: lo.loId,
    status: exceptions.length ? 'exception' : lo.status,
    spatialPath: lo.spatialPath,
    lastEvent: last || null,
    stageCodes,
    progress,
    integrity: verifyEventChain(events),
  };
}

export const SYNC_CODES = {
  DOWNSTREAM_TRIGGER: 'SYNC_DOWNSTREAM_TRIGGER',
  UPSTREAM_ACK: 'SYNC_UPSTREAM_ACK',
  HANDOFF: 'SYNC_HANDOFF',
};

/** 单 LO 种子（兼容旧壳） */
export const SEED_LO = createLO({
  loId: 'LO-NUCLEUS-001',
  channel: 'rural-last-mile',
  spatialPath: ['earth', 'cn', 'beijing'],
  originCellId: 'bj-yanqing-cell',
  destCellId: 'bj-west-hub',
  primaryActor: 'driver',
  contract: { slaHours: 6, service: 'cold-chain', cargo: '农产品样本' },
  links: [createChainLink({ rel: 'upstream', externalRef: 'farmer-wechat:demo', label: '农户下单' })],
});

/** 裂变 v2：农户 → 仓 → 干线 → 末端 四段链 */
export const SEED_NETWORK_LOS = [
  createLO({
    loId: 'LO-FARM-001',
    channel: 'farmer-pickup',
    primaryActor: 'shipper',
    originCellId: 'bj-yanqing-cell',
    destCellId: 'bj-shunyi-wh',
    contract: { slaHours: 4, service: 'agri-pickup', cargo: '延庆蔬菜' },
    links: [
      createChainLink({ rel: 'upstream', externalRef: 'farmer-wechat:demo', label: '农户下单' }),
      createChainLink({ rel: 'downstream', targetLoId: 'LO-WH-001', label: '送仓交接' }),
    ],
  }),
  createLO({
    loId: 'LO-WH-001',
    channel: 'warehouse-inbound',
    primaryActor: 'warehouse',
    originCellId: 'bj-shunyi-wh',
    destCellId: 'bj-shunyi-wh',
    contract: { slaHours: 8, service: 'inbound-pick-pack', cargo: '延庆蔬菜' },
    links: [
      createChainLink({ rel: 'upstream', targetLoId: 'LO-FARM-001', label: '农户到货' }),
      createChainLink({ rel: 'downstream', targetLoId: 'LO-LINE-001', label: '装车出库' }),
    ],
  }),
  createLO({
    loId: 'LO-LINE-001',
    channel: 'linehaul',
    primaryActor: 'driver',
    originCellId: 'bj-shunyi-wh',
    destCellId: 'bj-west-hub',
    contract: { slaHours: 3, service: 'trunk', cargo: '延庆蔬菜' },
    links: [
      createChainLink({ rel: 'upstream', targetLoId: 'LO-WH-001', label: '仓出' }),
      createChainLink({ rel: 'downstream', targetLoId: 'LO-LAST-001', label: '枢纽落地' }),
    ],
  }),
  createLO({
    loId: 'LO-LAST-001',
    channel: 'rural-last-mile',
    primaryActor: 'driver',
    originCellId: 'bj-west-hub',
    destCellId: 'bj-yanqing-cell',
    contract: { slaHours: 6, service: 'cold-chain', cargo: '延庆蔬菜' },
    links: [
      createChainLink({ rel: 'upstream', targetLoId: 'LO-LINE-001', label: '干线到货' }),
      createChainLink({ rel: 'downstream', externalRef: 'consumer:demo', label: '末端签收' }),
    ],
  }),
];

export const ACTOR_LENSES = {
  all: { id: 'all', labelZh: '全局', labelEn: 'Global', actions: ['view'] },
  dispatcher: { id: 'dispatcher', labelZh: '调度', labelEn: 'Dispatcher', actions: ['dispatch', 'replan'] },
  driver: { id: 'driver', labelZh: '司机', labelEn: 'Driver', actions: ['pickup', 'transit', 'pod'] },
  warehouse: { id: 'warehouse', labelZh: '仓管', labelEn: 'Warehouse', actions: ['inbound', 'pick', 'load'] },
  shipper: { id: 'shipper', labelZh: '货主', labelEn: 'Shipper', actions: ['create', 'confirm'] },
};

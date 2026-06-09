/**
 * DC / RDC / FDC 仓网 · 仓内作业 · 聚合/拆分 演示数据
 */

import { createLO, createChainLink, createSpatialCell } from './lot-nucleus.js';
import { domainStageCodes } from './lot-domains.js';
import { createAggregateParent, createSplitChild } from './lot-warehouse.js';

export const DEMO_SPATIAL_V5 = [
  createSpatialCell({
    id: 'bj-dc-shunyi',
    level: 'facility',
    parentId: 'beijing',
    labelZh: 'DC 顺义配送中心',
    labelEn: 'DC Shunyi',
    lat: 40.13,
    lng: 116.65,
    meta: { tier: 'dc' },
  }),
  createSpatialCell({
    id: 'bj-rdc-tongzhou',
    level: 'facility',
    parentId: 'beijing',
    labelZh: 'RDC 通州区域中心',
    labelEn: 'RDC Tongzhou',
    lat: 39.91,
    lng: 116.66,
    meta: { tier: 'rdc' },
  }),
  createSpatialCell({
    id: 'bj-fdc-wangjing',
    level: 'facility',
    parentId: 'beijing',
    labelZh: 'FDC 望京前置仓',
    labelEn: 'FDC Wangjing',
    lat: 39.995,
    lng: 116.47,
    meta: { tier: 'fdc' },
  }),
  createSpatialCell({ id: 'bj-dc-zone-recv', level: 'zone', parentId: 'bj-dc-shunyi', labelZh: 'DC 收货月台区', lat: 40.128, lng: 116.648 }),
  createSpatialCell({ id: 'bj-dc-zone-pick', level: 'zone', parentId: 'bj-dc-shunyi', labelZh: 'DC 拣货区', lat: 40.132, lng: 116.652 }),
  createSpatialCell({ id: 'bj-rdc-zone-xd', level: 'zone', parentId: 'bj-rdc-tongzhou', labelZh: 'RDC 越库区', lat: 39.908, lng: 116.662 }),
  createSpatialCell({ id: 'bj-fdc-zone-pick', level: 'zone', parentId: 'bj-fdc-wangjing', labelZh: 'FDC 微仓拣货区', lat: 39.993, lng: 116.472 }),
];

const WH_SCENARIOS = [
  { tier: 'dc', facility: 'bj-dc-shunyi', cargo: 'DC 大家电波次出库', dest: 'bj-daxing-port' },
  { tier: 'dc', facility: 'bj-dc-shunyi', cargo: 'DC 商超补货整托', dest: 'bj-langfang-terminal' },
  { tier: 'dc', facility: 'bj-dc-shunyi', cargo: 'DC 进口保税上架', dest: 'bj-dc-shunyi' },
  { tier: 'dc', facility: 'bj-dc-shunyi', cargo: 'DC ASRS 高位补货', dest: 'bj-dc-zone-pick' },
  { tier: 'rdc', facility: 'bj-rdc-tongzhou', cargo: 'RDC 区域越库直发', dest: 'bj-express-hub' },
  { tier: 'rdc', facility: 'bj-rdc-tongzhou', cargo: 'RDC 向下补货 FDC', dest: 'bj-fdc-wangjing' },
  { tier: 'rdc', facility: 'bj-rdc-tongzhou', cargo: 'RDC 电商合并波次', dest: 'bj-ec-sort' },
  { tier: 'rdc', facility: 'bj-rdc-tongzhou', cargo: 'RDC 退货二次分拣', dest: 'bj-tongzhou-wh' },
  { tier: 'fdc', facility: 'bj-fdc-wangjing', cargo: 'FDC 15分钟达生鲜', dest: 'bj-wangjing-store' },
  { tier: 'fdc', facility: 'bj-fdc-wangjing', cargo: 'FDC 夜间即时零售', dest: 'bj-courier-station' },
  { tier: 'fdc', facility: 'bj-fdc-wangjing', cargo: 'FDC 社区团购自提', dest: 'bj-wangjing-store' },
  { tier: 'fdc', facility: 'bj-fdc-wangjing', cargo: 'FDC 小件爆单拣配', dest: 'bj-guomao-store' },
];

const STATUS_MIX = ['active', 'active', 'active', 'exception', 'completed', 'active'];

function whActor(stageIx) {
  const a = ['warehouse', 'warehouse', 'qc', 'warehouse', 'equipment', 'warehouse', 'warehouse', 'warehouse', 'warehouse', 'warehouse', 'equipment', 'equipment', 'warehouse'];
  return a[stageIx] || 'warehouse';
}

function buildWhLO(ix, sc) {
  const loId = `LO-WHI-${String(ix + 1).padStart(3, '0')}`;
  const stages = domainStageCodes('warehouse_internal');
  return createLO({
    loId,
    logisticsDomain: 'warehouse_internal',
    facilityTier: sc.tier,
    channel: `wh-${sc.tier}`,
    originCellId: sc.facility,
    destCellId: sc.dest,
    primaryActor: 'warehouse',
    contract: { cargo: sc.cargo, tier: sc.tier, facility: sc.facility },
    links: [],
  });
}

function historyForWh(lo, depth) {
  const stages = domainStageCodes('warehouse_internal');
  const events = [];
  let count = depth === 0 ? 1 : depth === 1 ? 4 : depth === 2 ? 8 : depth === 3 ? stages.length : 3;
  for (let i = 0; i < count && i < stages.length; i++) {
    const code = stages[i];
    events.push({
      type: 'FACT',
      code,
      actor: whActor(i),
      spatialCellId: i < 4 ? lo.originCellId : lo.destCellId,
      payload: {
        cargo: lo.contract?.cargo,
        tier: lo.contract?.tier,
        equipment: code === 'ASRS_RETRIEVE' ? 'DC-ASRS-01' : code === 'SORT_DROP' ? 'DC-SORT-01' : null,
      },
    });
  }
  if (depth === 4) {
    events.push({
      type: 'EXCEPTION',
      code: 'EQUIPMENT_FAULT',
      actor: 'equipment',
      spatialCellId: lo.originCellId,
      payload: { reason: '演示：分拣机短暂故障' },
    });
  }
  return events;
}

const whLos = [];
const whHistories = new Map();
WH_SCENARIOS.forEach((sc, ix) => {
  const lo = buildWhLO(ix, sc);
  whLos.push(lo);
  whHistories.set(lo.loId, historyForWh(lo, ix % 5));
});

export const DEMO_AGGREGATE_LOS = [
  createAggregateParent({
    loId: 'LO-AGG-001',
    tier: 'rdc',
    facilityId: 'bj-rdc-tongzhou',
    destCellId: 'bj-express-hub',
    cargo: 'RDC 三单聚合波次（电商）',
    childLoIds: ['LO-ECM-001', 'LO-ECM-002', 'LO-ECM-003'],
    waveId: 'WAVE-DEMO-001',
  }),
  createAggregateParent({
    loId: 'LO-AGG-002',
    tier: 'fdc',
    facilityId: 'bj-fdc-wangjing',
    destCellId: 'bj-wangjing-store',
    cargo: 'FDC 即时零售合单',
    childLoIds: ['LO-ECM-007', 'LO-ECM-009'],
    waveId: 'WAVE-DEMO-002',
  }),
];

export const DEMO_SPLIT_PARENT = createLO({
  loId: 'LO-SPLIT-001',
  logisticsDomain: 'warehouse_internal',
  facilityTier: 'dc',
  channel: 'order-split-parent',
  originCellId: 'bj-dc-shunyi',
  destCellId: 'bj-daxing-port',
  primaryActor: 'warehouse',
  contract: { op: 'split-parent', cargo: 'DC 整车订单待拆', tier: 'dc', totalWeight: '18t' },
  links: [],
});

export const DEMO_SPLIT_CHILDREN = [
  createSplitChild(
    { loId: 'LO-SPL-001-A', cargo: '拆分件 A · 干线整车 1', tier: 'dc', originCellId: 'bj-dc-shunyi', destCellId: 'bj-langfang-terminal', splitSeq: 1 },
    'LO-SPLIT-001'
  ),
  createSplitChild(
    { loId: 'LO-SPL-001-B', cargo: '拆分件 B · 干线整车 2', tier: 'dc', originCellId: 'bj-dc-shunyi', destCellId: 'bj-daxing-port', splitSeq: 2 },
    'LO-SPLIT-001'
  ),
  createSplitChild(
    { loId: 'LO-SPL-001-C', cargo: '拆分件 C · 城配零担', tier: 'dc', originCellId: 'bj-dc-shunyi', destCellId: 'bj-express-hub', splitSeq: 3 },
    'LO-SPLIT-001'
  ),
];

function aggHistory(lo) {
  return [
    { type: 'DECISION', code: 'ORDER_AGGREGATED', actor: 'warehouse', spatialCellId: lo.originCellId, payload: { childLoIds: lo.contract?.childLoIds } },
    { type: 'FACT', code: 'WAVE_RELEASE', actor: 'warehouse', spatialCellId: lo.originCellId, payload: { waveId: lo.contract?.waveId } },
    { type: 'FACT', code: 'PICK_CONFIRM', actor: 'warehouse', spatialCellId: lo.originCellId, payload: {} },
    { type: 'FACT', code: 'SORT_DROP', actor: 'equipment', spatialCellId: lo.destCellId, payload: { equipment: 'RDC-SORT-01' } },
  ];
}

function splitParentHistory() {
  return [
    { type: 'FACT', code: 'WAVE_RELEASE', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: {} },
    { type: 'DECISION', code: 'ORDER_SPLIT', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: { parts: 3 } },
  ];
}

export const DEMO_DOMAIN_LOS_V5 = [
  ...whLos,
  ...DEMO_AGGREGATE_LOS,
  DEMO_SPLIT_PARENT,
  ...DEMO_SPLIT_CHILDREN,
];

export const DEMO_EVENT_HISTORIES_V5 = new Map([
  ...whHistories,
  ...DEMO_AGGREGATE_LOS.map((lo) => [lo.loId, aggHistory(lo)]),
  [DEMO_SPLIT_PARENT.loId, splitParentHistory()],
  ...DEMO_SPLIT_CHILDREN.map((c, i) => [
    c.loId,
    [
      {
        type: 'FACT',
        code: 'SPLIT_CHILD_CREATED',
        actor: 'warehouse',
        spatialCellId: c.originCellId,
        payload: { parentLoId: 'LO-SPLIT-001', splitSeq: i + 1 },
      },
      { type: 'FACT', code: 'PICK_CONFIRM', actor: 'warehouse', spatialCellId: c.originCellId, payload: {} },
    ],
  ]),
]);

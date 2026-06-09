/**
 * 大量演示数据 — 四大物流域 × 多场景 × 预置事件链
 */

import { createLO, createChainLink, createSpatialCell } from './lot-nucleus.js';
import { domainStageCodes } from './lot-domains.js';

export const DEMO_SPATIAL_EXT = [
  createSpatialCell({ id: 'bj-tianjin-supplier', level: 'hub', parentId: 'jjj', labelZh: '天津供应商集配', labelEn: 'Tianjin Supplier Hub', lat: 39.12, lng: 117.2 }),
  createSpatialCell({ id: 'bj-yizhuang-factory', level: 'facility', parentId: 'beijing', labelZh: '亦庄工厂', labelEn: 'Yizhuang Plant', lat: 39.79, lng: 116.52 }),
  createSpatialCell({ id: 'bj-yizhuang-line', level: 'zone', parentId: 'bj-yizhuang-factory', labelZh: '亦庄 A 线边', labelEn: 'Line-side A', lat: 39.788, lng: 116.525 }),
  createSpatialCell({ id: 'bj-guomao-store', level: 'cell', parentId: 'beijing', labelZh: '国贸门店', labelEn: 'Guomao Store', lat: 39.908, lng: 116.46 }),
  createSpatialCell({ id: 'bj-zhongguancun-dc', level: 'facility', parentId: 'beijing', labelZh: '中关村 DC', labelEn: 'Zhongguancun DC', lat: 39.983, lng: 116.316 }),
  createSpatialCell({ id: 'bj-daxing-port', level: 'hub', parentId: 'beijing', labelZh: '大兴物流港', labelEn: 'Daxing Port', lat: 39.72, lng: 116.41 }),
  createSpatialCell({ id: 'bj-wangjing-store', level: 'cell', parentId: 'beijing', labelZh: '望京社区店', labelEn: 'Wangjing Store', lat: 39.995, lng: 116.47 }),
  createSpatialCell({ id: 'bj-tongzhou-wh', level: 'facility', parentId: 'beijing', labelZh: '通州仓', labelEn: 'Tongzhou WH', lat: 39.91, lng: 116.66 }),
  createSpatialCell({ id: 'bj-financial-cust', level: 'cell', parentId: 'beijing', labelZh: '金融街客户', labelEn: 'Financial St. Customer', lat: 39.917, lng: 116.366 }),
];

const PROCUREMENT_SCENARIOS = [
  { cargo: '电子元器件 IC 批次', supplier: '深圳芯联', qty: '12 托盘', origin: 'bj-tianjin-supplier', dest: 'bj-shunyi-wh' },
  { cargo: '包装耗材', supplier: '廊坊包材厂', qty: '800 箱', origin: 'bj-tianjin-supplier', dest: 'bj-tongzhou-wh' },
  { cargo: '冷链原料乳', supplier: '内蒙古牧源', qty: '6 车次', origin: 'bj-daxing-port', dest: 'bj-shunyi-wh' },
  { cargo: '进口红酒', supplier: '天津港保税', qty: '2 集装箱', origin: 'bj-daxing-port', dest: 'bj-shunyi-wh' },
  { cargo: 'MRO 备件', supplier: '固安工业', qty: '45 SKU', origin: 'bj-tianjin-supplier', dest: 'bj-yizhuang-factory' },
  { cargo: '标签耗材', supplier: '通州印刷', qty: '200 卷', origin: 'bj-tongzhou-wh', dest: 'bj-shunyi-wh' },
  { cargo: '钢材卷板', supplier: '唐山钢铁', qty: '18 吨', origin: 'bj-daxing-port', dest: 'bj-yizhuang-factory' },
  { cargo: '芯片测试板', supplier: '中关村科技', qty: '30 箱', origin: 'bj-zhongguancun-dc', dest: 'bj-yizhuang-factory' },
  { cargo: '办公耗材集采', supplier: '京东企业购', qty: '1 整车', origin: 'bj-tongzhou-wh', dest: 'bj-zhongguancun-dc' },
];

const SALES_SCENARIOS = [
  { cargo: '延庆有机蔬菜礼盒', channel: '社区团购', origin: 'bj-shunyi-wh', dest: 'bj-wangjing-store' },
  { cargo: '国贸写字楼下午茶', channel: 'B2B 定时达', origin: 'bj-shunyi-wh', dest: 'bj-guomao-store' },
  { cargo: '中关村 IT 外设', channel: '电商次日达', origin: 'bj-zhongguancun-dc', dest: 'bj-zhongguancun-dc' },
  { cargo: '金融街银行礼品', channel: '高端配送', origin: 'bj-tongzhou-wh', dest: 'bj-financial-cust' },
  { cargo: '望京母婴用品', channel: '即时零售', origin: 'bj-shunyi-wh', dest: 'bj-wangjing-store' },
  { cargo: '整车家电', channel: '大件宅配', origin: 'bj-daxing-port', dest: 'bj-yanqing-cell' },
  { cargo: '冷链疫苗样本', channel: '医药冷链', origin: 'bj-shunyi-wh', dest: 'bj-west-hub' },
  { cargo: '跨境海淘包裹', channel: '保税仓发', origin: 'bj-daxing-port', dest: 'bj-guomao-store' },
  { cargo: '门店补货零食', channel: '连锁补货', origin: 'bj-tongzhou-wh', dest: 'bj-guomao-store' },
];

const PRODUCTION_SCENARIOS = [
  { cargo: 'SMT 贴片料盘', wo: 'WO-2406-A', origin: 'bj-shunyi-wh', dest: 'bj-yizhuang-line' },
  { cargo: '总装螺栓包', wo: 'WO-2406-B', origin: 'bj-tongzhou-wh', dest: 'bj-yizhuang-line' },
  { cargo: '半成品机柜', wo: 'WO-2406-C', origin: 'bj-yizhuang-line', dest: 'bj-yizhuang-factory' },
  { cargo: '成品服务器', wo: 'WO-2406-D', origin: 'bj-yizhuang-factory', dest: 'bj-shunyi-wh' },
  { cargo: '工装模具', wo: 'WO-2405-E', origin: 'bj-yizhuang-factory', dest: 'bj-yizhuang-line' },
  { cargo: '线边空箱回收', wo: 'WO-2406-F', origin: 'bj-yizhuang-line', dest: 'bj-tongzhou-wh' },
  { cargo: '试产样机', wo: 'WO-PILOT-1', origin: 'bj-yizhuang-factory', dest: 'bj-zhongguancun-dc' },
  { cargo: '返修组件', wo: 'WO-REWORK-2', origin: 'bj-yizhuang-line', dest: 'bj-yizhuang-factory' },
  { cargo: '包装线包材', wo: 'WO-2406-G', origin: 'bj-tongzhou-wh', dest: 'bj-yizhuang-line' },
];

const REVERSE_SCENARIOS = [
  { cargo: '电商七天无理由', reason: '尺码不合', origin: 'bj-wangjing-store', dest: 'bj-tongzhou-wh' },
  { cargo: '质量问题退机', reason: '开机故障', origin: 'bj-guomao-store', dest: 'bj-yizhuang-factory' },
  { cargo: '冷链超温拒收', reason: '温度超标', origin: 'bj-financial-cust', dest: 'bj-shunyi-wh' },
  { cargo: '错发换货', reason: 'SKU 错误', origin: 'bj-zhongguancun-dc', dest: 'bj-tongzhou-wh' },
  { cargo: '租赁到期回收', reason: '合同到期', origin: 'bj-guomao-store', dest: 'bj-daxing-port' },
  { cargo: '残次品召回', reason: '批次召回', origin: 'bj-wangjing-store', dest: 'bj-shunyi-wh' },
  { cargo: '试用退回', reason: '未采购', origin: 'bj-financial-cust', dest: 'bj-zhongguancun-dc' },
  { cargo: '包装破损', reason: '运输破损', origin: 'bj-yanqing-cell', dest: 'bj-tongzhou-wh' },
  { cargo: '过期促销退回', reason: '临期下架', origin: 'bj-guomao-store', dest: 'bj-shunyi-wh' },
];

const STATUS_MIX = ['active', 'active', 'active', 'exception', 'completed', 'active', 'active', 'completed', 'active'];

function buildLO(domain, ix, scenario, statusIx) {
  const prefix = { procurement: 'PUR', sales: 'SAL', production: 'MFG', reverse: 'REV' }[domain];
  const loId = `LO-${prefix}-${String(ix + 1).padStart(3, '0')}`;
  const stages = domainStageCodes(domain);
  const status = STATUS_MIX[statusIx % STATUS_MIX.length];
  return createLO({
    loId,
    channel: scenario.channel || domain,
    status,
    logisticsDomain: domain,
    originCellId: scenario.origin,
    destCellId: scenario.dest,
    primaryActor: stages[0] ? domainActor(domain, 0) : 'dispatcher',
    spatialPath: ['earth', 'cn', 'beijing'],
    contract: {
      cargo: scenario.cargo,
      supplier: scenario.supplier,
      qty: scenario.qty,
      wo: scenario.wo,
      reason: scenario.reason,
      channel: scenario.channel,
      slaHours: 12 + (ix % 5) * 6,
    },
    links: [
      createChainLink({ rel: 'upstream', externalRef: `${domain}:seed:${ix}`, label: '演示上游' }),
    ],
  });
}

function domainActor(domain, stageIx) {
  const actors = {
    procurement: ['purchaser', 'supplier', 'dispatcher', 'warehouse', 'qc', 'qc', 'warehouse', 'finance'],
    sales: ['shipper', 'warehouse', 'warehouse', 'warehouse', 'driver', 'driver', 'finance'],
    production: ['planner', 'warehouse', 'driver', 'production', 'production', 'warehouse', 'planner'],
    reverse: ['customer', 'cs', 'driver', 'warehouse', 'qc', 'warehouse', 'finance'],
  };
  return actors[domain]?.[stageIx] || 'dispatcher';
}

/** 按完成度预置事件（0=仅创建, 1=进行中, 2=大半, 3=完成, 4=异常） */
function historyForLO(lo, depth) {
  const domain = lo.logisticsDomain;
  const stages = domainStageCodes(domain);
  const events = [];
  let count = 0;
  if (depth === 0) count = 1;
  else if (depth === 1) count = Math.max(2, Math.floor(stages.length * 0.35));
  else if (depth === 2) count = Math.max(4, Math.floor(stages.length * 0.65));
  else if (depth === 3) count = stages.length;
  else if (depth === 4) count = Math.min(4, stages.length);

  for (let i = 0; i < count; i++) {
    const st = stages[i];
    if (!st) break;
    events.push({
      type: 'FACT',
      code: st,
      actor: domainActor(domain, i),
      spatialCellId: i % 2 ? lo.destCellId : lo.originCellId,
      payload: {
        cargo: lo.contract?.cargo,
        evidence: domain === 'procurement' ? ['scan', 'photo'] : ['gps'],
        step: i + 1,
        total: stages.length,
      },
    });
  }
  if (depth === 4) {
    events.push({
      type: 'EXCEPTION',
      code: 'DELAY_ALERT',
      actor: 'dispatcher',
      spatialCellId: lo.originCellId,
      payload: { reason: '演示异常：延误/质检待定' },
    });
  }
  if (depth === 3 && domain === 'sales') {
    events.push({
      type: 'FINANCE',
      code: 'SETTLEMENT',
      actor: 'finance',
      spatialCellId: lo.destCellId,
      payload: { amount: 1200 + Math.floor(Math.random() * 800) },
    });
  }
  return events;
}

function genDomainLos(domain, scenarios) {
  const los = [];
  const histories = new Map();
  scenarios.forEach((sc, ix) => {
    const depth = ix % 5;
    const lo = buildLO(domain, ix, sc, ix);
    los.push(lo);
    histories.set(lo.loId, historyForLO(lo, depth));
  });
  return { los, histories };
}

const pur = genDomainLos('procurement', PROCUREMENT_SCENARIOS);
const sal = genDomainLos('sales', SALES_SCENARIOS);
const mfg = genDomainLos('production', PRODUCTION_SCENARIOS);
const rev = genDomainLos('reverse', REVERSE_SCENARIOS);

export const DEMO_DOMAIN_LOS = [...pur.los, ...sal.los, ...mfg.los, ...rev.los];

export const DEMO_EVENT_HISTORIES = new Map([
  ...pur.histories,
  ...sal.histories,
  ...mfg.histories,
  ...rev.histories,
]);

/** 保留 v2 销售链四段（亦归入 sales 域演示） */
export { SEED_NETWORK_LOS } from './lot-nucleus.js';

export function countByDomain(los) {
  const c = { procurement: 0, sales: 0, production: 0, reverse: 0, other: 0 };
  for (const lo of los) {
    const d = lo.logisticsDomain || lo.channel;
    if (c[d] != null) c[d]++;
    else c.other++;
  }
  return c;
}

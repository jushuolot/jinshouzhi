/**
 * 大量演示数据 — 七大物流域 × 多场景 × 预置事件链
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
  createSpatialCell({ id: 'bj-ec-sort', level: 'facility', parentId: 'beijing', labelZh: '电商分拣中心', labelEn: 'E-com Sort Center', lat: 39.86, lng: 116.55 }),
  createSpatialCell({ id: 'bj-express-hub', level: 'hub', parentId: 'beijing', labelZh: '快递转运中心', labelEn: 'Express Hub', lat: 39.88, lng: 116.38 }),
  createSpatialCell({ id: 'bj-langfang-terminal', level: 'hub', parentId: 'jjj', labelZh: '廊坊干线场站', labelEn: 'Langfang Terminal', lat: 39.52, lng: 116.7 }),
  createSpatialCell({ id: 'bj-daxing-air-cargo', level: 'hub', parentId: 'beijing', labelZh: '大兴航空货站', labelEn: 'Air Cargo Terminal', lat: 39.51, lng: 116.41 }),
  createSpatialCell({ id: 'bj-courier-station', level: 'cell', parentId: 'beijing', labelZh: '望京快递站', labelEn: 'Wangjing Courier Sta.', lat: 39.99, lng: 116.48 }),
];

export const DEMO_SPATIAL_V4 = [
  createSpatialCell({ id: 'bj-ec-sort', level: 'facility', parentId: 'beijing', labelZh: '电商分拣中心', labelEn: 'E-com Sort Center', lat: 39.86, lng: 116.55 }),
  createSpatialCell({ id: 'bj-express-hub', level: 'hub', parentId: 'beijing', labelZh: '快递转运中心', labelEn: 'Express Hub', lat: 39.88, lng: 116.38 }),
  createSpatialCell({ id: 'bj-langfang-terminal', level: 'hub', parentId: 'jjj', labelZh: '廊坊干线场站', labelEn: 'Langfang Terminal', lat: 39.52, lng: 116.7 }),
  createSpatialCell({ id: 'bj-daxing-air-cargo', level: 'hub', parentId: 'beijing', labelZh: '大兴航空货站', labelEn: 'Air Cargo Terminal', lat: 39.51, lng: 116.41 }),
  createSpatialCell({ id: 'bj-courier-station', level: 'cell', parentId: 'beijing', labelZh: '望京快递站', labelEn: 'Wangjing Courier Sta.', lat: 39.99, lng: 116.48 }),
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

const ECOMMERCE_SCENARIOS = [
  { cargo: '天猫 3C 数码', platform: '天猫', shop: '旗舰店', origin: 'bj-ec-sort', dest: 'bj-wangjing-store' },
  { cargo: '京东 POP 家电', platform: '京东', shop: 'POP 店', origin: 'bj-tongzhou-wh', dest: 'bj-yanqing-cell' },
  { cargo: '抖音直播美妆', platform: '抖音', shop: '直播间', origin: 'bj-ec-sort', dest: 'bj-guomao-store' },
  { cargo: '拼多多农货', platform: '拼多多', shop: '产地直发', origin: 'bj-yanqing-cell', dest: 'bj-daxing-port' },
  { cargo: '小红书礼盒', platform: '小红书', shop: '品牌号', origin: 'bj-ec-sort', dest: 'bj-financial-cust' },
  { cargo: '跨境电商保税', platform: '考拉', shop: '保税仓', origin: 'bj-daxing-port', dest: 'bj-zhongguancun-dc' },
  { cargo: '微信小店生鲜', platform: '微信', shop: '社区店', origin: 'bj-shunyi-wh', dest: 'bj-wangjing-store' },
  { cargo: '1688 批发单', platform: '1688', shop: '工厂店', origin: 'bj-yizhuang-factory', dest: 'bj-tongzhou-wh' },
  { cargo: '唯品会特卖', platform: '唯品会', shop: '特卖仓', origin: 'bj-ec-sort', dest: 'bj-courier-station' },
];

const EXPRESS_SCENARIOS = [
  { cargo: '顺丰标快文件', carrier: 'SF', service: '标快', origin: 'bj-guomao-store', dest: 'bj-zhongguancun-dc' },
  { cargo: '中通电商小件', carrier: 'ZTO', service: '电商件', origin: 'bj-ec-sort', dest: 'bj-wangjing-store' },
  { cargo: '圆通同城当日', carrier: 'YTO', service: '同城', origin: 'bj-express-hub', dest: 'bj-financial-cust' },
  { cargo: '韵达批量包', carrier: 'Yunda', service: '集包', origin: 'bj-express-hub', dest: 'bj-daxing-port' },
  { cargo: '申通逆向件', carrier: 'STO', service: '退货', origin: 'bj-wangjing-store', dest: 'bj-tongzhou-wh' },
  { cargo: '极兔社区件', carrier: 'J&T', service: '驿站', origin: 'bj-courier-station', dest: 'bj-yanqing-cell' },
  { cargo: 'EMS 政务函件', carrier: 'EMS', service: '标准', origin: 'bj-west-hub', dest: 'bj-guomao-store' },
  { cargo: '德邦大件', carrier: 'Deppon', service: '大件', origin: 'bj-daxing-port', dest: 'bj-yizhuang-factory' },
  { cargo: '京东快递 211', carrier: 'JD', service: '211', origin: 'bj-tongzhou-wh', dest: 'bj-zhongguancun-dc' },
];

const LINEHAUL_SCENARIOS = [
  { cargo: '北京-上海整车', mode: '公路整车', origin: 'bj-langfang-terminal', dest: 'bj-daxing-port' },
  { cargo: '京津廊零担', mode: '零担', origin: 'bj-shunyi-wh', dest: 'bj-langfang-terminal' },
  { cargo: '京沪冷链干线', mode: '冷链', origin: 'bj-shunyi-wh', dest: 'bj-daxing-air-cargo' },
  { cargo: '环京快递干线', mode: '快递干线', origin: 'bj-express-hub', dest: 'bj-west-hub' },
  { cargo: '电商仓间调拨', mode: '仓间调拨', origin: 'bj-tongzhou-wh', dest: 'bj-ec-sort' },
  { cargo: '铁公联运集装箱', mode: '多式联运', origin: 'bj-west-hub', dest: 'bj-daxing-port' },
  { cargo: '航空普货出港', mode: '航空', origin: 'bj-daxing-air-cargo', dest: 'bj-daxing-port' },
  { cargo: '华北-东北长干线', mode: '长途', origin: 'bj-langfang-terminal', dest: 'bj-tianjin-supplier' },
  { cargo: '亦庄-顺义短驳', mode: '短驳', origin: 'bj-yizhuang-factory', dest: 'bj-shunyi-wh' },
];

const STATUS_MIX = ['active', 'active', 'active', 'exception', 'completed', 'active', 'active', 'completed', 'active'];

function buildLO(domain, ix, scenario, statusIx) {
  const prefix = {
    procurement: 'PUR',
    sales: 'SAL',
    production: 'MFG',
    reverse: 'REV',
    ecommerce: 'ECM',
    express: 'EXP',
    linehaul: 'LHL',
  }[domain];
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
      platform: scenario.platform,
      shop: scenario.shop,
      carrier: scenario.carrier,
      service: scenario.service,
      mode: scenario.mode,
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
    ecommerce: ['platform', 'finance', 'warehouse', 'warehouse', 'warehouse', 'dispatcher', 'platform', 'platform'],
    express: ['dispatcher', 'courier', 'warehouse', 'warehouse', 'dispatcher', 'courier', 'courier', 'finance'],
    linehaul: ['dispatcher', 'dispatcher', 'driver', 'driver', 'driver', 'driver', 'driver', 'warehouse'],
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
  if (depth === 3 && (domain === 'sales' || domain === 'express')) {
    events.push({
      type: 'FINANCE',
      code: domain === 'express' ? 'COD_SETTLE' : 'SETTLEMENT',
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
const ecm = genDomainLos('ecommerce', ECOMMERCE_SCENARIOS);
const exp = genDomainLos('express', EXPRESS_SCENARIOS);
const lhl = genDomainLos('linehaul', LINEHAUL_SCENARIOS);

export const DEMO_DOMAIN_LOS_V3 = [...pur.los, ...sal.los, ...mfg.los, ...rev.los];
export const DEMO_DOMAIN_LOS_V4 = [...ecm.los, ...exp.los, ...lhl.los];
export const DEMO_DOMAIN_LOS = [...DEMO_DOMAIN_LOS_V3, ...DEMO_DOMAIN_LOS_V4];

export const DEMO_EVENT_HISTORIES_V3 = new Map([
  ...pur.histories,
  ...sal.histories,
  ...mfg.histories,
  ...rev.histories,
]);
export const DEMO_EVENT_HISTORIES_V4 = new Map([...ecm.histories, ...exp.histories, ...lhl.histories]);
export const DEMO_EVENT_HISTORIES = new Map([...DEMO_EVENT_HISTORIES_V3, ...DEMO_EVENT_HISTORIES_V4]);

/** 保留 v2 销售链四段（亦归入 sales 域演示） */
export { SEED_NETWORK_LOS } from './lot-nucleus.js';

export function countByDomain(los) {
  const c = {
    procurement: 0,
    sales: 0,
    production: 0,
    reverse: 0,
    ecommerce: 0,
    express: 0,
    linehaul: 0,
    warehouse_internal: 0,
    other: 0,
  };
  for (const lo of los) {
    const d = lo.logisticsDomain || lo.channel;
    if (c[d] != null) c[d]++;
    else c.other++;
  }
  return c;
}

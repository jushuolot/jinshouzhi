/**
 * 物流招投标演示数据 — 9 类招标 × 投标报价 × 全链对接
 */

import { createLO, createChainLink } from './lot-nucleus.js';
import { domainStageCodes } from './lot-domains.js';
import { TENDER_SCOPES } from './lot-tender.js';

const TENDER_SCENARIOS = [
  {
    scope: 'transport',
    title: '京津冀干线运输服务招标',
    budget: '¥ 280万/年',
    linkedLoId: 'LO-LHL-002',
    origin: 'bj-langfang-terminal',
    dest: 'bj-daxing-port',
    bidders: [
      { name: '顺丰速运', price: '¥265万', score: 92, winner: true },
      { name: '德邦快递', price: '¥258万', score: 88 },
      { name: '京东物流', price: '¥272万', score: 90 },
    ],
  },
  {
    scope: 'warehouse',
    title: '顺义 DC 仓储运营外包',
    budget: '¥ 150万/年',
    linkedLoId: 'LO-WHI-001',
    origin: 'bj-dc-shunyi',
    dest: 'bj-dc-shunyi',
    bidders: [
      { name: '普洛斯运营', price: '¥142万', score: 91, winner: true },
      { name: '万纬物流', price: '¥138万', score: 87 },
      { name: '宝湾物流', price: '¥145万', score: 89 },
    ],
  },
  {
    scope: 'express',
    title: '北京城区快递配送服务',
    budget: '¥ 95万/年',
    linkedLoId: 'LO-EXP-003',
    origin: 'bj-express-hub',
    dest: 'bj-wangjing-store',
    bidders: [
      { name: '中通快递', price: '¥88万', score: 86, winner: true },
      { name: '圆通速递', price: '¥85万', score: 84 },
      { name: '韵达快递', price: '¥90万', score: 85 },
    ],
  },
  {
    scope: 'integrated',
    title: '一体化 3PL 全链条服务',
    budget: '¥ 520万/年',
    linkedLoId: 'LO-SAL-003',
    origin: 'bj-dc-shunyi',
    dest: 'bj-guomao-store',
    bidders: [
      { name: '中国外运', price: '¥498万', score: 94, winner: true },
      { name: '招商物流', price: '¥485万', score: 90 },
      { name: '日日顺供应链', price: '¥510万', score: 92 },
    ],
  },
  {
    scope: 'equipment',
    title: '自动化分拣设备采购',
    budget: '¥ 680万',
    linkedLoId: 'LO-PUR-002',
    origin: 'bj-ec-sort',
    dest: 'bj-dc-shunyi',
    bidders: [
      { name: '中科微至', price: '¥650万', score: 93, winner: true },
      { name: '德马科技', price: '¥620万', score: 89 },
      { name: '今天国际', price: '¥665万', score: 91 },
    ],
  },
  {
    scope: 'cold_chain',
    title: '冷链干线运输招标',
    budget: '¥ 180万/年',
    linkedLoId: 'LO-LHL-003',
    origin: 'bj-shunyi-wh',
    dest: 'bj-daxing-air-cargo',
    bidders: [
      { name: '鲜生活冷链', price: '¥172万', score: 90, winner: true },
      { name: '夏晖物流', price: '¥168万', score: 88 },
    ],
  },
  {
    scope: 'last_mile',
    title: '望京片区末端即时配送',
    budget: '¥ 60万/年',
    linkedLoId: 'LO-EXP-009',
    origin: 'bj-fdc-wangjing',
    dest: 'bj-wangjing-store',
    bidders: [
      { name: '闪送', price: '¥55万', score: 85, winner: true },
      { name: '达达快送', price: '¥52万', score: 83 },
      { name: '美团配送', price: '¥58万', score: 87 },
    ],
  },
  {
    scope: 'customs',
    title: '大兴港关务代理服务',
    budget: '¥ 45万/年',
    linkedLoId: 'LO-PUR-004',
    origin: 'bj-daxing-port',
    dest: 'bj-daxing-port',
    bidders: [
      { name: '中外运关务', price: '¥42万', score: 92, winner: true },
      { name: '华贸物流', price: '¥40万', score: 88 },
    ],
  },
  {
    scope: 'reverse_logistics',
    title: '电商退货逆向物流服务',
    budget: '¥ 38万/年',
    linkedLoId: 'LO-REV-001',
    origin: 'bj-tongzhou-wh',
    dest: 'bj-ec-sort',
    bidders: [
      { name: '逆向专家物流', price: '¥35万', score: 88, winner: true },
      { name: '菜鸟退件网络', price: '¥33万', score: 86 },
    ],
  },
];

function tenderActor(ix) {
  const a = ['tender_officer', 'tender_officer', 'tender_officer', 'bidder', 'bidder', 'evaluator', 'evaluator', 'evaluator', 'tender_officer', 'legal'];
  return a[ix] || 'tender_officer';
}

function buildTenderLO(ix, sc) {
  const scopeMeta = TENDER_SCOPES[sc.scope];
  return createLO({
    loId: `LO-TDR-${String(ix + 1).padStart(3, '0')}`,
    logisticsDomain: 'tender',
    channel: 'logistics-bidding',
    originCellId: sc.origin,
    destCellId: sc.dest,
    primaryActor: 'tender_officer',
    contract: {
      scope: sc.scope,
      scopeLabel: scopeMeta?.labelZh,
      title: sc.title,
      budget: sc.budget,
      linkedLoId: sc.linkedLoId,
      targetDomain: scopeMeta?.targetDomain,
      bidders: sc.bidders,
    },
    links: [
      createChainLink({ rel: 'downstream', targetLoId: sc.linkedLoId, label: '中标履约对接' }),
    ],
  });
}

function historyForTender(lo, depth) {
  const stages = domainStageCodes('tender');
  const events = [];
  const count = depth === 0 ? 2 : depth === 1 ? 5 : depth === 2 ? 8 : depth === 3 ? stages.length : 4;
  for (let i = 0; i < count && i < stages.length; i++) {
    events.push({
      type: i >= 7 ? 'DECISION' : 'FACT',
      code: stages[i],
      actor: tenderActor(i),
      spatialCellId: lo.originCellId,
      payload: { title: lo.contract?.title, step: i + 1 },
    });
  }
  if (depth >= 3) {
    events.push({
      type: 'SYNC',
      code: 'KICKOFF_SYNC',
      actor: 'tender_officer',
      spatialCellId: lo.originCellId,
      payload: { linkedLoId: lo.contract?.linkedLoId, auto: true },
    });
  }
  return events;
}

const los = [];
const histories = new Map();
TENDER_SCENARIOS.forEach((sc, ix) => {
  const lo = buildTenderLO(ix, sc);
  los.push(lo);
  histories.set(lo.loId, historyForTender(lo, ix % 5));
});

export const DEMO_DOMAIN_LOS_V7 = los;
export const DEMO_EVENT_HISTORIES_V7 = histories;

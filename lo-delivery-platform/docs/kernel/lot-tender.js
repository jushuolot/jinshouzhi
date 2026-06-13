/**
 * 物流招投标 — 与全链条 LO 对接
 * 招标 LO 中标后 → SYNC 启动采购/仓内/干线/快递 履约单
 */

import { propagateSync } from './lot-network.js';

/** 招标品类 → 履约域映射 */
export const TENDER_SCOPES = {
  transport: { labelZh: '运输招标', targetDomain: 'linehaul', icon: '🚛' },
  warehouse: { labelZh: '仓储运营招标', targetDomain: 'warehouse_internal', icon: '🏭' },
  express: { labelZh: '快递配送招标', targetDomain: 'express', icon: '📮' },
  integrated: { labelZh: '一体化 3PL', targetDomain: 'sales', icon: '🔗' },
  equipment: { labelZh: '物流设备招标', targetDomain: 'procurement', icon: '⚙️' },
  cold_chain: { labelZh: '冷链物流招标', targetDomain: 'linehaul', icon: '❄️' },
  last_mile: { labelZh: '末端配送招标', targetDomain: 'express', icon: '📦' },
  customs: { labelZh: '关务物流招标', targetDomain: 'procurement', icon: '🛃' },
  reverse_logistics: { labelZh: '逆向物流招标', targetDomain: 'reverse', icon: '♻️' },
};

/** 中标启动 → 下游履约 LO 的首个事件码 */
export const AWARD_KICKOFF_FACT = {
  transport: 'LOAD_PLAN',
  warehouse: 'DOCK_CHECKIN',
  express: 'PICKUP_REQ',
  integrated: 'ORDER_CREATED',
  equipment: 'PO_ISSUED',
  cold_chain: 'VEHICLE_ASSIGN',
  last_mile: 'PICKUP_REQ',
  customs: 'PO_ISSUED',
  reverse_logistics: 'RMA_OPEN',
};

/** 中标后向履约 LO 裂变 SYNC（由 KICKOFF_SYNC 事件触发） */
export async function propagateAward(chain, tenderLoId) {
  const tender = await chain.getLO(tenderLoId);
  if (!tender?.contract?.linkedLoId) return null;
  const scope = tender.contract.scope || 'transport';
  const factCode = AWARD_KICKOFF_FACT[scope] || 'ORDER_CREATED';
  const winner = (tender.contract.bidders || []).find((b) => b.winner);
  return propagateSync(chain, tenderLoId, tender.contract.linkedLoId, 'SYNC_AWARD_KICKOFF', {
    factCode,
    tenderLoId,
    winner: winner?.name,
    scope,
  });
}

/** 演示：走完招标后半段并启动全链 */
export async function runTenderAwardDemo(chain, tenderLoId = 'LO-TDR-001') {
  const steps = [
    { code: 'EVAL_TECH', actor: 'evaluator' },
    { code: 'EVAL_PRICE', actor: 'evaluator' },
    { code: 'AWARD_NOTICE', actor: 'tender_officer' },
    { code: 'CONTRACT_SIGN', actor: 'legal' },
    { code: 'BOND_PAID', actor: 'finance' },
    { code: 'KICKOFF_SYNC', actor: 'tender_officer' },
  ];
  const tender = await chain.getLO(tenderLoId);
  for (const s of steps) {
    await chain.emitAction(tenderLoId, {
      ...s,
      spatialCellId: tender?.originCellId,
      payload: { demo: true },
    });
  }
  return chain.getLO(tenderLoId);
}

export function getBidLeaderboard(lo) {
  const bidders = lo?.contract?.bidders || [];
  return [...bidders].sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function renderBidTableHtml(lo) {
  const rows = getBidLeaderboard(lo);
  if (!rows.length) return '<p class="lo-meta">无投标记录</p>';
  return (
    '<table style="width:100%;font-size:10px;border-collapse:collapse">' +
    '<tr style="color:#6d9ab8"><th align="left">投标人</th><th>报价</th><th>得分</th></tr>' +
    rows
      .map(
        (b) =>
          `<tr style="${b.winner ? 'color:#3dffb0' : ''}">` +
          `<td>${b.winner ? '★ ' : ''}${b.name}</td>` +
          `<td align="center">${b.price}</td>` +
          `<td align="center">${b.score}</td></tr>`
      )
      .join('') +
    '</table>'
  );
}

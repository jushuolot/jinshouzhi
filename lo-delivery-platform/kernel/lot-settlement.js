/**
 * BMS — 企业间点对点结算（货主 ↔ 承运 / 货主 ↔ 仓）
 */

export const SETTLEMENT_STATUS = {
  pending_recon: { labelZh: '待对账' },
  confirmed: { labelZh: '已确认' },
  invoiced: { labelZh: '已开票' },
  paid: { labelZh: '已付款' },
  disputed: { labelZh: '争议中' },
};

export function createPeerSettlement(partial) {
  const now = new Date().toISOString();
  return {
    settlementId: partial.settlementId,
    chainOrderId: partial.chainOrderId,
    mode: 'peer_to_peer',
    payerEnterpriseId: partial.payerEnterpriseId,
    payeeEnterpriseId: partial.payeeEnterpriseId,
    legLoId: partial.legLoId || null,
    feeType: partial.feeType,
    title: partial.title || '',
    amount: partial.amount ?? 0,
    currency: partial.currency || 'CNY',
    status: partial.status || 'pending_recon',
    lines: partial.lines || [],
    triggerCode: partial.triggerCode || 'POD_SIGNED',
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
  };
}

/** 签收后按协作关系生成点对点结算单 */
export function defaultPeerSettlements(chainOrderId, anchorEnterpriseId, legs) {
  const out = [];
  const wh = legs.find((l) => l.legType === 'warehouse_internal' || l.domain === 'warehouse_internal');
  const lh = legs.find((l) => l.legType === 'linehaul' || l.domain === 'linehaul');
  const suffix = chainOrderId.replace('CO-', '');

  if (lh) {
    out.push(
      createPeerSettlement({
        settlementId: `STL-FREIGHT-${suffix}`,
        chainOrderId,
        payerEnterpriseId: anchorEnterpriseId,
        payeeEnterpriseId: lh.ownerEnterpriseId || 'ENT-ZHOU-CARRIER',
        legLoId: lh.loId,
        feeType: 'freight',
        title: '干线运费 · 点对点',
        amount: 3860,
        lines: [
          { lineNo: 1, name: '干线运输', qty: 1, uom: '票', price: 2800, amount: 2800 },
          { lineNo: 2, name: '末端接驳', qty: 1, uom: '票', price: 1060, amount: 1060 },
        ],
      })
    );
  }
  if (wh) {
    out.push(
      createPeerSettlement({
        settlementId: `STL-WH-${suffix}`,
        chainOrderId,
        payerEnterpriseId: anchorEnterpriseId,
        payeeEnterpriseId: wh.ownerEnterpriseId || 'ENT-LOT-3PL',
        legLoId: wh.loId,
        feeType: 'warehouse',
        title: '仓储操作费 · 点对点',
        amount: 1280,
        lines: [
          { lineNo: 1, name: '入库卸货', qty: 1, uom: '票', price: 380, amount: 380 },
          { lineNo: 2, name: '拣配复核', qty: 1, uom: '票', price: 520, amount: 520 },
          { lineNo: 3, name: '装车出库', qty: 1, uom: '票', price: 380, amount: 380 },
        ],
      })
    );
  }
  return out;
}

export function renderSettlementRow(stl, enterprises) {
  const payer = enterprises.find((e) => e.id === stl.payerEnterpriseId)?.nameZh || stl.payerEnterpriseId;
  const payee = enterprises.find((e) => e.id === stl.payeeEnterpriseId)?.nameZh || stl.payeeEnterpriseId;
  const st = SETTLEMENT_STATUS[stl.status]?.labelZh || stl.status;
  return `<tr data-stl="${stl.settlementId}">
    <td>${stl.title}</td>
    <td>${payer} → ${payee}</td>
    <td align="right">¥${stl.amount}</td>
    <td>${st}</td>
  </tr>`;
}

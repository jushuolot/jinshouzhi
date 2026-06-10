/**
 * 物流单据：头 + 明细行 + 订单/LO 关联
 */

export const DOC_TYPES = {
  SO: { labelZh: '销售订单', subsystem: 'oms', icon: '📋' },
  PO: { labelZh: '采购订单', subsystem: 'oms', icon: '🛒' },
  ASN: { labelZh: '预到货通知', subsystem: 'wms', icon: '📥' },
  GRN: { labelZh: '入库单', subsystem: 'wms', icon: '✅' },
  PICK: { labelZh: '拣货单', subsystem: 'wms', icon: '📦' },
  DN: { labelZh: '发货单', subsystem: 'wms', icon: '🚚' },
  WB: { labelZh: '运单', subsystem: 'tms', icon: '🛣️' },
  POD: { labelZh: '签收单', subsystem: 'tms', icon: '✍️' },
  INV: { labelZh: '发票', subsystem: 'bms', icon: '🧾' },
  STL: { labelZh: '结算单', subsystem: 'bms', icon: '💰' },
  BID: { labelZh: '投标文件', subsystem: 'tender', icon: '📨' },
  CTR: { labelZh: '招标合同', subsystem: 'tender', icon: '📜' },
};

export function createDocument(partial) {
  const type = partial.docType || 'SO';
  const meta = DOC_TYPES[type] || DOC_TYPES.SO;
  return {
    docId: partial.docId,
    docType: type,
    subsystem: partial.subsystem || meta.subsystem,
    loId: partial.loId,
    rel: partial.rel || 'source',
    status: partial.status || 'draft',
    header: {
      docNo: partial.header?.docNo || partial.docId,
      title: partial.header?.title || meta.labelZh,
      partyFrom: partial.header?.partyFrom || '',
      partyTo: partial.header?.partyTo || '',
      amount: partial.header?.amount ?? 0,
      taxAmount: partial.header?.taxAmount ?? 0,
      currency: partial.header?.currency || 'CNY',
      enterpriseId: partial.header?.enterpriseId || 'ENT-LOT',
      deptId: partial.header?.deptId || '',
      createdByRole: partial.header?.createdByRole || 'sales',
      createdAt: partial.header?.createdAt || new Date().toISOString(),
      ...partial.header,
    },
    lines: (partial.lines || []).map((ln, i) => ({
      lineNo: ln.lineNo ?? i + 1,
      sku: ln.sku || '',
      name: ln.name || '',
      spec: ln.spec || '',
      qty: ln.qty ?? 0,
      uom: ln.uom || '件',
      price: ln.price ?? 0,
      amount: ln.amount ?? (ln.qty || 0) * (ln.price || 0),
      batch: ln.batch || '',
      location: ln.location || '',
      remark: ln.remark || '',
    })),
    links: partial.links || [],
  };
}

export function docMatchesSubsystem(doc, subsystemId) {
  if (!subsystemId || subsystemId === 'all') return true;
  if (doc.subsystem === subsystemId) return true;
  const sub = { bms: ['INV', 'STL', 'COD', 'RECON'] };
  if (subsystemId === 'bms' && sub.bms.includes(doc.docType)) return true;
  return false;
}

export function getDocsForLo(documents, loId) {
  return documents.filter((d) => d.loId === loId || d.links?.some((l) => l.loId === loId));
}

export function buildDocGraph(documents) {
  const edges = [];
  for (const d of documents) {
    for (const l of d.links || []) {
      if (l.docId) edges.push({ from: d.docId, to: l.docId, rel: l.rel || 'ref' });
      if (l.loId) edges.push({ from: d.docId, to: l.loId, rel: 'lo', isLo: true });
    }
  }
  return edges;
}

export function renderDocLinesTable(doc) {
  if (!doc?.lines?.length) return '<p class="doc-empty">无明细行</p>';
  const rows = doc.lines
    .map(
      (ln) =>
        `<tr>
          <td>${ln.lineNo}</td>
          <td>${ln.sku}</td>
          <td>${ln.name}</td>
          <td>${ln.spec || '—'}</td>
          <td align="right">${ln.qty}</td>
          <td>${ln.uom}</td>
          <td align="right">${ln.price?.toFixed?.(2) ?? ln.price}</td>
          <td align="right">${ln.amount?.toFixed?.(2) ?? ln.amount}</td>
          <td>${ln.batch || '—'}</td>
          <td>${ln.location || '—'}</td>
        </tr>`
    )
    .join('');
  return (
    '<table class="doc-lines"><thead><tr>' +
    '<th>#</th><th>SKU</th><th>品名</th><th>规格</th><th>数量</th><th>单位</th><th>单价</th><th>金额</th><th>批次</th><th>库位</th>' +
    '</tr></thead><tbody>' +
    rows +
    '</tbody></table>'
  );
}

export function renderDocCard(doc, active) {
  const meta = DOC_TYPES[doc.docType] || { labelZh: doc.docType, icon: '📄' };
  const cls = active ? ' doc-card on' : ' doc-card';
  return (
    `<div class="${cls.trim()}" data-doc="${doc.docId}">` +
    `<div class="doc-card-head">${meta.icon} <b>${doc.header.docNo}</b> <span>${meta.labelZh}</span></div>` +
    `<div class="doc-card-sub">${doc.header.partyFrom} → ${doc.header.partyTo} · ¥${doc.header.amount}</div>` +
    `<div class="doc-card-lo">↔ ${doc.loId}</div></div>`
  );
}

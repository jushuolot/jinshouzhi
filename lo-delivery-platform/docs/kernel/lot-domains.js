/**
 * LOT Domains — 采购 / 销售 / 生产 / 逆向 物流全要素
 * 每域：环节 · 角色 · 标准事件码 · 证据要求
 */

export const LOGISTICS_DOMAINS = {
  procurement: {
    id: 'procurement',
    icon: '🛒',
    labelZh: '采购物流',
    labelEn: 'Procurement',
    color: '#5eb8ff',
    descZh: '供应商 → 采购订单 → 提货 → 越库/入库 → 质检 → 上架 → 三单匹配',
    stages: [
      { code: 'PO_ISSUED', labelZh: '采购订单下达', actor: 'purchaser', evidence: ['po_pdf'] },
      { code: 'SUPPLIER_CONFIRM', labelZh: '供应商确认交期', actor: 'supplier', evidence: ['asn'] },
      { code: 'PICKUP_SCHEDULED', labelZh: '提货排程', actor: 'dispatcher', evidence: ['appointment'] },
      { code: 'INBOUND_ARRIVAL', labelZh: '到货登记', actor: 'warehouse', evidence: ['gate_pass'] },
      { code: 'QC_SAMPLE', labelZh: '来料抽检', actor: 'qc', evidence: ['qc_report'] },
      { code: 'QC_PASS', labelZh: '质检合格', actor: 'qc', evidence: ['coa'] },
      { code: 'PUTAWAY_DONE', labelZh: '上架完成', actor: 'warehouse', evidence: ['location_scan'] },
      { code: 'INVOICE_MATCHED', labelZh: '三单匹配', actor: 'finance', evidence: ['invoice', 'po', 'grn'] },
    ],
  },
  sales: {
    id: 'sales',
    icon: '📦',
    labelZh: '销售物流',
    labelEn: 'Sales / Distribution',
    color: '#3dffb0',
    descZh: '订单承接 → 库存分配 → 拣配 → 出库 → 干线/城配 → 签收 → 结算',
    stages: [
      { code: 'ORDER_CREATED', labelZh: '销售订单创建', actor: 'shipper', evidence: ['so'] },
      { code: 'ALLOCATION', labelZh: '库存分配', actor: 'warehouse', evidence: ['alloc_note'] },
      { code: 'PICK_PACK', labelZh: '拣配复核', actor: 'warehouse', evidence: ['pick_list'] },
      { code: 'LOADED', labelZh: '装车发运', actor: 'warehouse', evidence: ['load_manifest'] },
      { code: 'IN_TRANSIT', labelZh: '在途跟踪', actor: 'driver', evidence: ['gps'] },
      { code: 'POD_SIGNED', labelZh: '客户签收', actor: 'driver', evidence: ['pod', 'photo'] },
      { code: 'SETTLEMENT', labelZh: '运费结算', actor: 'finance', evidence: ['freight_bill'] },
    ],
  },
  production: {
    id: 'production',
    icon: '⚙️',
    labelZh: '生产物流',
    labelEn: 'Production',
    color: '#ffc14d',
    descZh: '叫料 → 线边配送 → 在制品转移 → 成品下线 → 成品入库 → 生产核销',
    stages: [
      { code: 'MATERIAL_CALL', labelZh: '生产叫料', actor: 'planner', evidence: ['mrp_ticket'] },
      { code: 'KIT_PICK', labelZh: '齐套拣选', actor: 'warehouse', evidence: ['kit_list'] },
      { code: 'LINE_DELIVERY', labelZh: '线边配送', actor: 'driver', evidence: ['agv_task', 'scan'] },
      { code: 'WIP_TRANSFER', labelZh: '在制品转移', actor: 'production', evidence: ['wip_tag'] },
      { code: 'FG_OUTPUT', labelZh: '成品下线', actor: 'production', evidence: ['output_scan'] },
      { code: 'FG_STOCK_IN', labelZh: '成品入库', actor: 'warehouse', evidence: ['fg_label'] },
      { code: 'PROD_CLOSE', labelZh: '工单核销', actor: 'planner', evidence: ['wo_close'] },
    ],
  },
  reverse: {
    id: 'reverse',
    icon: '♻️',
    labelZh: '逆向物流',
    labelEn: 'Reverse / Returns',
    color: '#ff7eb3',
    descZh: '退货申请 → 审批 → 上门取件 → 质检分级 → 翻新/报废 → 退款/补货',
    stages: [
      { code: 'RMA_OPEN', labelZh: '退货申请', actor: 'customer', evidence: ['rma_form'] },
      { code: 'RMA_APPROVED', labelZh: '退货审批', actor: 'cs', evidence: ['approval'] },
      { code: 'REVERSE_PICKUP', labelZh: '逆向取件', actor: 'driver', evidence: ['pickup_photo'] },
      { code: 'INBOUND_RETURN', labelZh: '退货入库', actor: 'warehouse', evidence: ['return_scan'] },
      { code: 'INSPECTION_GRADE', labelZh: '质检分级', actor: 'qc', evidence: ['grade_sheet'] },
      { code: 'RESTOCK_OR_SCRAP', labelZh: '翻新或报废', actor: 'warehouse', evidence: ['disposition'] },
      { code: 'REFUND_ISSUED', labelZh: '退款/补货', actor: 'finance', evidence: ['credit_note'] },
    ],
  },
};

export const EXTENDED_ACTORS = {
  purchaser: { id: 'purchaser', labelZh: '采购员', labelEn: 'Purchaser' },
  supplier: { id: 'supplier', labelZh: '供应商', labelEn: 'Supplier' },
  planner: { id: 'planner', labelZh: '计划员', labelEn: 'Planner' },
  production: { id: 'production', labelZh: '生产', labelEn: 'Production' },
  qc: { id: 'qc', labelZh: '质检', labelEn: 'QC' },
  finance: { id: 'finance', labelZh: '财务', labelEn: 'Finance' },
  customer: { id: 'customer', labelZh: '客户', labelEn: 'Customer' },
  cs: { id: 'cs', labelZh: '客服', labelEn: 'CS' },
};

export function getDomain(id) {
  return LOGISTICS_DOMAINS[id] || null;
}

export function domainStageCodes(domainId) {
  const d = getDomain(domainId);
  return d ? d.stages.map((s) => s.code) : [];
}

export function progressForDomain(domainId, eventCodes) {
  const stages = domainStageCodes(domainId);
  if (!stages.length) return 0;
  let hit = 0;
  for (const code of stages) {
    if (eventCodes.includes(code)) hit++;
  }
  return Math.min(100, Math.round((hit / stages.length) * 100));
}

export function stageDetail(domainId, code) {
  const d = getDomain(domainId);
  return d?.stages.find((s) => s.code === code) || null;
}

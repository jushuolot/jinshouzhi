/**
 * LOT Domains — 采购 / 销售 / 生产 / 逆向 / 电商 / 快递 / 干线 物流全要素
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
  ecommerce: {
    id: 'ecommerce',
    icon: '🛍️',
    labelZh: '电商物流',
    labelEn: 'E-commerce Fulfillment',
    color: '#a78bfa',
    descZh: '平台订单 → 支付核销 → 波次释放 → 拣配 → 面单 → 交承运 → 轨迹回传 → 签收回告',
    stages: [
      { code: 'PLATFORM_ORDER', labelZh: '平台订单接入', actor: 'platform', evidence: ['order_json', 'shop_id'] },
      { code: 'PAYMENT_CLEARED', labelZh: '支付/风控通过', actor: 'finance', evidence: ['payment_id'] },
      { code: 'WMS_WAVE', labelZh: '波次/批次释放', actor: 'warehouse', evidence: ['wave_id'] },
      { code: 'PICK_PACK', labelZh: '拣配复核', actor: 'warehouse', evidence: ['pick_list', 'weight'] },
      { code: 'WAYBILL_PRINT', labelZh: '电子面单打印', actor: 'warehouse', evidence: ['waybill_no', 'label'] },
      { code: 'HANDOVER_CARRIER', labelZh: '交承运商揽收', actor: 'dispatcher', evidence: ['handover_manifest'] },
      { code: 'TRACK_PUBLISH', labelZh: '物流轨迹发布', actor: 'platform', evidence: ['track_url'] },
      { code: 'DELIVERED_NOTIFY', labelZh: '签收回告平台', actor: 'platform', evidence: ['callback_ack'] },
    ],
  },
  express: {
    id: 'express',
    icon: '📮',
    labelZh: '快递物流',
    labelEn: 'Express / Courier',
    color: '#38bdf8',
    descZh: '揽收请求 → 收件扫描 → 首分拨 → 分拣 → 干线发运 → 派送出站 → 签收扫描 → 代收货款',
    stages: [
      { code: 'PICKUP_REQ', labelZh: '揽收任务下发', actor: 'dispatcher', evidence: ['pickup_task'] },
      { code: 'COLLECT_SCAN', labelZh: '收件扫描', actor: 'courier', evidence: ['scan', 'photo'] },
      { code: 'SORT_HUB_IN', labelZh: '首分拨到件', actor: 'warehouse', evidence: ['hub_in_scan'] },
      { code: 'SORT_SCAN', labelZh: '分拣扫描', actor: 'warehouse', evidence: ['chute_no', 'bag_tag'] },
      { code: 'LINEHAUL_DISPATCH', labelZh: '干线/下一网点发运', actor: 'dispatcher', evidence: ['load_no'] },
      { code: 'OUT_DELIVERY', labelZh: '派送出站', actor: 'courier', evidence: ['route_sheet'] },
      { code: 'POD_SCAN', labelZh: '签收扫描', actor: 'courier', evidence: ['pod_scan', 'sign_photo'] },
      { code: 'COD_SETTLE', labelZh: '代收货款核销', actor: 'finance', evidence: ['cod_receipt'] },
    ],
  },
  linehaul: {
    id: 'linehaul',
    icon: '🚂',
    labelZh: '干线物流',
    labelEn: 'Linehaul / Trunk',
    color: '#fb923c',
    descZh: '配载计划 → 车辆调度 → 场站发出 → 途检查验 → 服务区 → 在途监控 → 到港/到站 → 卸货完成',
    stages: [
      { code: 'LOAD_PLAN', labelZh: '配载/装载计划', actor: 'dispatcher', evidence: ['load_plan', 'cube_weight'] },
      { code: 'VEHICLE_ASSIGN', labelZh: '车辆与司机指派', actor: 'dispatcher', evidence: ['vehicle_no', 'driver_id'] },
      { code: 'DEPART_TERMINAL', labelZh: '场站发出', actor: 'driver', evidence: ['gate_out', 'seal_no'] },
      { code: 'TOLL_CROSS', labelZh: '途检/收费站', actor: 'driver', evidence: ['toll_receipt', 'checkpoint'] },
      { code: 'REST_AREA', labelZh: '服务区停靠', actor: 'driver', evidence: ['gps', 'temp_log'] },
      { code: 'TRANSIT_CHECK', labelZh: '在途监控打卡', actor: 'driver', evidence: ['gps_trace'] },
      { code: 'ARRIVE_HUB', labelZh: '到达枢纽/港口', actor: 'driver', evidence: ['gate_in'] },
      { code: 'UNLOAD_COMPLETE', labelZh: '卸货交接完成', actor: 'warehouse', evidence: ['unload_manifest', 'damage_note'] },
    ],
  },
  warehouse_internal: {
    id: 'warehouse_internal',
    icon: '🏗️',
    labelZh: '仓内物流',
    labelEn: 'Warehouse Internal',
    color: '#94a3b8',
    descZh: 'DC/RDC/FDC 月台 → 上架 → 自动化取货 → 补货 → 波次 → 拣配 → 包装称重 → 分拣集货',
    stages: [
      { code: 'DOCK_CHECKIN', labelZh: '月台登记', actor: 'warehouse', evidence: ['dock_appt'] },
      { code: 'UNLOAD_SCAN', labelZh: '卸货扫描', actor: 'warehouse', evidence: ['unload_scan'] },
      { code: 'QC_GATE', labelZh: '入库质检', actor: 'qc', evidence: ['qc_gate'] },
      { code: 'PUTAWAY_TASK', labelZh: '上架任务', actor: 'warehouse', evidence: ['putaway_task'] },
      { code: 'ASRS_RETRIEVE', labelZh: '自动化取货', actor: 'equipment', evidence: ['asrs_cmd', 'crane_log'] },
      { code: 'REPLENISH', labelZh: '补货至拣货区', actor: 'warehouse', evidence: ['replen_task'] },
      { code: 'WAVE_RELEASE', labelZh: '波次释放', actor: 'warehouse', evidence: ['wave_id'] },
      { code: 'PICK_TASK', labelZh: '拣货任务下发', actor: 'warehouse', evidence: ['pick_task'] },
      { code: 'PICK_CONFIRM', labelZh: '拣货确认', actor: 'warehouse', evidence: ['pick_scan'] },
      { code: 'PACK_DONE', labelZh: '包装完成', actor: 'warehouse', evidence: ['pack_scan'] },
      { code: 'WEIGHT_SCAN', labelZh: 'DWS 称重扫描', actor: 'equipment', evidence: ['weight', 'dim'] },
      { code: 'SORT_DROP', labelZh: '分拣投递', actor: 'equipment', evidence: ['chute', 'bag'] },
      { code: 'STAGE_OUT', labelZh: '集货区待发', actor: 'warehouse', evidence: ['stage_lane'] },
    ],
  },
  tender: {
    id: 'tender',
    icon: '📋',
    labelZh: '物流招投标',
    labelEn: 'Logistics Tender / Bidding',
    color: '#e879f9',
    descZh: '立项 → 发布公告 → 投标 → 开标评标 → 中标公示 → 签合同 → 保证金 → 启动全链履约',
    stages: [
      { code: 'TENDER_PLAN', labelZh: '招标计划立项', actor: 'tender_officer', evidence: ['plan_doc', 'budget'] },
      { code: 'TENDER_PUBLISH', labelZh: '发布公告', actor: 'tender_officer', evidence: ['notice_pdf', 'platform_id'] },
      { code: 'BID_QUESTION', labelZh: '答疑澄清', actor: 'tender_officer', evidence: ['qa_log'] },
      { code: 'BID_SUBMIT', labelZh: '投标收标', actor: 'bidder', evidence: ['bid_package', 'seal'] },
      { code: 'BID_OPEN', labelZh: '开标', actor: 'tender_officer', evidence: ['open_record', 'video'] },
      { code: 'EVAL_TECH', labelZh: '技术评标', actor: 'evaluator', evidence: ['tech_score'] },
      { code: 'EVAL_PRICE', labelZh: '商务评标', actor: 'evaluator', evidence: ['price_score'] },
      { code: 'AWARD_NOTICE', labelZh: '中标公示', actor: 'tender_officer', evidence: ['award_notice'] },
      { code: 'CONTRACT_SIGN', labelZh: '合同签订', actor: 'legal', evidence: ['contract_pdf'] },
      { code: 'BOND_PAID', labelZh: '履约保证金', actor: 'finance', evidence: ['bond_receipt'] },
      { code: 'KICKOFF_SYNC', labelZh: '启动全链履约', actor: 'tender_officer', evidence: ['kickoff_minutes'] },
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
  platform: { id: 'platform', labelZh: '电商平台', labelEn: 'Platform' },
  courier: { id: 'courier', labelZh: '快递员', labelEn: 'Courier' },
  equipment: { id: 'equipment', labelZh: '自动化设备', labelEn: 'Automation' },
  tender_officer: { id: 'tender_officer', labelZh: '招标专员', labelEn: 'Tender Officer' },
  bidder: { id: 'bidder', labelZh: '投标人', labelEn: 'Bidder' },
  evaluator: { id: 'evaluator', labelZh: '评标专家', labelEn: 'Evaluator' },
  legal: { id: 'legal', labelZh: '法务', labelEn: 'Legal' },
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

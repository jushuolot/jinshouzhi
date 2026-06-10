/**
 * 企业 · 部门 · 角色 · 子系统权限
 * 全景 SCM 可拆为 OMS / WMS / TMS / BMS / 招投标 独立体系
 */

export const SUBSYSTEMS = {
  all: {
    id: 'all',
    icon: '🌐',
    labelZh: '全景 SCM',
    labelEn: 'Full SCM',
    descZh: '订单、仓储、运输、结算、招投标一体可视',
    domains: null,
  },
  oms: {
    id: 'oms',
    icon: '📋',
    labelZh: 'OMS',
    labelEn: 'Order Management',
    descZh: '销售订单、采购订单、电商履约、订单拆分聚合',
    domains: ['sales', 'ecommerce', 'procurement'],
  },
  wms: {
    id: 'wms',
    icon: '🏭',
    labelZh: 'WMS',
    labelEn: 'Warehouse',
    descZh: '入库、波次、拣货、复核、装车、DC/RDC/FDC 仓网',
    domains: ['warehouse_internal', 'production'],
  },
  tms: {
    id: 'tms',
    icon: '🚛',
    labelZh: 'TMS',
    labelEn: 'Transport',
    descZh: '干线配载、在途跟踪、末端配送、司机任务',
    domains: ['linehaul', 'express'],
  },
  bms: {
    id: 'bms',
    icon: '💰',
    labelZh: 'BMS',
    labelEn: 'Billing',
    descZh: '对账、开票、结算、COD、三单匹配',
    domains: ['sales', 'linehaul', 'express', 'reverse', 'ecommerce'],
    docTypes: ['INV', 'STL', 'COD', 'RECON'],
  },
  tender: {
    id: 'tender',
    icon: '📑',
    labelZh: '招投标',
    labelEn: 'Tender',
    descZh: '招标立项、投标评标、合同签订、履约启动',
    domains: ['tender'],
  },
};

export const ENTERPRISE = {
  id: 'ENT-LOT',
  nameZh: 'LOT 物流科技集团',
  nameEn: 'LOT Logistics Group',
};

export const DEPARTMENTS = [
  { id: 'DEPT-HQ', nameZh: '集团总部', enterpriseId: 'ENT-LOT' },
  { id: 'DEPT-OPS', nameZh: '运营中心', enterpriseId: 'ENT-LOT' },
  { id: 'DEPT-SALES', nameZh: '销售部', enterpriseId: 'ENT-LOT', parentId: 'DEPT-OPS' },
  { id: 'DEPT-PROC', nameZh: '采购部', enterpriseId: 'ENT-LOT', parentId: 'DEPT-OPS' },
  { id: 'DEPT-WH', nameZh: '仓储部', enterpriseId: 'ENT-LOT', parentId: 'DEPT-OPS' },
  { id: 'DEPT-TMS', nameZh: '运输部', enterpriseId: 'ENT-LOT', parentId: 'DEPT-OPS' },
  { id: 'DEPT-FIN', nameZh: '财务部', enterpriseId: 'ENT-LOT' },
  { id: 'DEPT-LEGAL', nameZh: '法务部', enterpriseId: 'ENT-LOT' },
];

/** 业务角色：部门归属 + 子系统 + 操作权限 */
export const BUSINESS_ROLES = [
  {
    id: 'all',
    nameZh: '运营管理员',
    deptId: 'DEPT-HQ',
    subsystems: ['all'],
    permissions: ['*'],
    hintZh: '全链路、全子系统、全部操作',
  },
  {
    id: 'sales',
    nameZh: '销售',
    deptId: 'DEPT-SALES',
    subsystems: ['oms', 'all'],
    permissions: ['oms.view', 'oms.so.create', 'oms.so.confirm', 'doc.view', 'console.view'],
    hintZh: '销售订单创建与确认、客户 SLA',
  },
  {
    id: 'purchase',
    nameZh: '采购',
    deptId: 'DEPT-PROC',
    subsystems: ['oms', 'all'],
    permissions: ['oms.view', 'oms.po.create', 'oms.po.approve', 'doc.view', 'console.view'],
    hintZh: '采购订单、供应商交期',
  },
  {
    id: 'warehouse',
    nameZh: '库管',
    deptId: 'DEPT-WH',
    subsystems: ['wms', 'all'],
    permissions: ['wms.view', 'wms.asn', 'wms.grn', 'wms.pick', 'wms.ship', 'doc.view', 'console.view', 'ops.aggregate', 'ops.split'],
    hintZh: '入库、拣货、复核、装车',
  },
  {
    id: 'dispatch',
    nameZh: '调度',
    deptId: 'DEPT-TMS',
    subsystems: ['tms', 'all'],
    permissions: ['tms.view', 'tms.dispatch', 'tms.route', 'doc.view', 'console.view', 'demo.play'],
    hintZh: '配载、改派、干线调度',
  },
  {
    id: 'driver',
    nameZh: '司机',
    deptId: 'DEPT-TMS',
    subsystems: ['tms'],
    permissions: ['tms.view', 'tms.pod', 'doc.view'],
    hintZh: '末端签收、回单上传',
  },
  {
    id: 'finance',
    nameZh: '财务',
    deptId: 'DEPT-FIN',
    subsystems: ['bms', 'all'],
    permissions: ['bms.view', 'bms.invoice', 'bms.settle', 'bms.recon', 'doc.view', 'console.view'],
    hintZh: '对账、开票、结算',
  },
  {
    id: 'tender_officer',
    nameZh: '招标专员',
    deptId: 'DEPT-LEGAL',
    subsystems: ['tender', 'all'],
    permissions: ['tender.view', 'tender.publish', 'tender.award', 'doc.view', 'console.view', 'ops.tender'],
    hintZh: '招标发布、评标、中标启动',
  },
  {
    id: 'shipper',
    nameZh: '货主',
    deptId: 'DEPT-HQ',
    subsystems: ['oms', 'all'],
    permissions: ['oms.view', 'doc.view', 'demo.play'],
    hintZh: '委托下单、跟踪全链、费用确认',
  },
];

export const PERMISSION_LABELS = {
  'oms.view': '查看订单',
  'oms.so.create': '创建销售单',
  'oms.so.confirm': '确认销售单',
  'oms.po.create': '创建采购单',
  'oms.po.approve': '审批采购单',
  'wms.view': '查看仓储',
  'wms.asn': '预到货 ASN',
  'wms.grn': '入库 GRN',
  'wms.pick': '拣货复核',
  'wms.ship': '出库装车',
  'tms.view': '查看运输',
  'tms.dispatch': '调度配载',
  'tms.route': '路线规划',
  'tms.pod': '签收回单',
  'bms.view': '查看结算',
  'bms.invoice': '开票',
  'bms.settle': '结算',
  'bms.recon': '三单对账',
  'tender.view': '查看招标',
  'tender.publish': '发布公告',
  'tender.award': '中标启动',
  'doc.view': '查看单据',
  'console.view': '打开控制台',
  'demo.play': '播放全链',
  'ops.aggregate': '订单聚合',
  'ops.split': '订单拆分',
  'ops.tender': '招标演示',
  'ops.fission': '裂变进化',
};

export function getDept(id) {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function getRole(id) {
  return BUSINESS_ROLES.find((r) => r.id === id) || BUSINESS_ROLES[0];
}

export function roleHasPermission(roleId, perm) {
  const role = getRole(roleId);
  if (!role) return false;
  if (role.permissions.includes('*')) return true;
  return role.permissions.includes(perm);
}

export function roleCanAccessSubsystem(roleId, subsystemId) {
  const role = getRole(roleId);
  if (!role) return false;
  if (role.subsystems.includes('all') || subsystemId === 'all') return true;
  return role.subsystems.includes(subsystemId);
}

export function domainsForSubsystem(subsystemId) {
  const sub = SUBSYSTEMS[subsystemId];
  if (!sub || !sub.domains) return null;
  return sub.domains;
}

export function listPermissionsForRole(roleId) {
  const role = getRole(roleId);
  if (!role) return [];
  if (role.permissions.includes('*')) return Object.keys(PERMISSION_LABELS);
  return role.permissions.filter((p) => PERMISSION_LABELS[p]);
}

/**
 * 社会型物流生态链 — 多集团 · 多企业
 */

export const GROUPS = [
  { id: 'GRP-BRAND-A', nameZh: '陆氏消费品牌集团', type: 'brand' },
  { id: 'GRP-LOG-B', nameZh: '华北智慧物流集团', type: 'logistics' },
  { id: 'GRP-SUP-C', nameZh: '环京原料供应联盟', type: 'supplier' },
];

export const ENTERPRISES = [
  {
    id: 'ENT-LUWEI-BRAND',
    groupId: 'GRP-BRAND-A',
    nameZh: '陆委托品牌（货主）',
    roles: ['shipper'],
  },
  {
    id: 'ENT-LOT-3PL',
    groupId: 'GRP-LOG-B',
    nameZh: '顺义智慧仓（3PL）',
    roles: ['warehouse'],
  },
  {
    id: 'ENT-ZHOU-CARRIER',
    groupId: 'GRP-LOG-B',
    nameZh: '周干线运输',
    roles: ['carrier'],
  },
  {
    id: 'ENT-YANQING-SUP',
    groupId: 'GRP-SUP-C',
    nameZh: '延庆原料供应',
    roles: ['supplier'],
  },
];

export function getEnterprise(id) {
  return ENTERPRISES.find((e) => e.id === id);
}

export function getGroup(id) {
  return GROUPS.find((g) => g.id === id);
}

export function enterprisesInGroup(groupId) {
  return ENTERPRISES.filter((e) => e.groupId === groupId);
}

/** 企业可见链段：货主看全链；协作方只看己相关段 + 必要上下游摘要 */
export function visibleLegTypes(viewerEnterpriseId) {
  const ent = getEnterprise(viewerEnterpriseId);
  if (!ent) return null;
  if (ent.roles.includes('shipper')) return null;
  if (ent.roles.includes('supplier')) return ['procurement', 'production'];
  if (ent.roles.includes('warehouse')) return ['procurement', 'warehouse_internal', 'sales'];
  if (ent.roles.includes('carrier')) return ['linehaul', 'express', 'sales'];
  return ['sales'];
}

export function canViewLeg(viewerEnterpriseId, legType) {
  const allowed = visibleLegTypes(viewerEnterpriseId);
  if (!allowed) return true;
  return allowed.includes(legType);
}

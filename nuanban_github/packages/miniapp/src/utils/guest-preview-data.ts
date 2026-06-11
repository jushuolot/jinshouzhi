import type { ElderStats, OrderRow } from '../api/elder';
import type { FamilyStats } from '../api/family';
import type { StudentStats } from '../api/student';
import type { ActivityEvent } from './demo-activity';
import {
  DEMO_ORG_MAIN,
  DEMO_USERS,
  SERVICE_PACKAGES,
  buildRichElders,
  buildRichOrders,
} from './demo-rich-data';

const elders = buildRichElders();
const orders = buildRichOrders(elders);

const SERVICE_NAMES: Record<string, string> = {
  'svc-chat': '聊天陪伴',
  'svc-read': '读报陪聊',
  'svc-chess': '棋牌陪伴',
  'svc-life': '生活陪护',
  'svc-med': '用药提醒',
  'svc-rehab': '康复协助',
  'svc-finger': '手指操',
  'svc-walk': '外出陪同',
  'svc-hospital': '就医陪同',
  'svc-shop': '代购代办',
};

function orderPreviewRows(limit = 3): (OrderRow & { expand?: { service_item?: { name: string } } })[] {
  return orders
    .filter((o) => o.elder === 'elder-1' && o.status !== 'cancelled')
    .slice(0, limit)
    .map((o) => ({
      id: o.id,
      status: o.status,
      amount_cents: o.amount_cents,
      scheduled_at: o.scheduled_at,
      expand: { service_item: { name: SERVICE_NAMES[o.service_item] || '陪护服务' } },
    }));
}

export const GUEST_ELDER_PREVIEW = {
  stats: {
    elderName: '张奶奶',
    orderCount: 5,
    activeCount: 2,
    caregiverNearbyCount: 8,
    elderProfileId: 'elder-1',
  } satisfies ElderStats,
  orgName: DEMO_ORG_MAIN.name,
  walletBalanceYuan: '300.00',
  serviceLogCount: 6,
  recentOrders: orderPreviewRows(3),
};

export const GUEST_FAMILY_PREVIEW = {
  stats: {
    boundElderCount: 2,
    pendingPaymentCount: orders.filter((o) => o.status === 'pending_payment').length,
    pendingConfirmCount: orders.filter((o) => o.status === 'pending_confirm').length,
    outdoorPendingCount: 2,
    sosPendingCount: 1,
    paidTotalCents: 128500,
    paidTotalYuan: '1285.00',
  } satisfies FamilyStats,
  bindings: [
    {
      id: 'bind-1',
      elder: 'elder-1',
      relation_label: '女儿',
      expand: { elder: { name: '张奶奶' } },
    },
    {
      id: 'bind-2',
      elder: 'elder-2',
      relation_label: '儿媳',
      expand: { elder: { name: '李爷爷' } },
    },
  ],
  walletBalanceYuan: '500.00',
  serviceLogCount: 8,
  packageCount: SERVICE_PACKAGES.length,
  recentActivities: [
    {
      id: 'act-1',
      kind: 'order_created',
      title: '订单待支付',
      detail: '张奶奶 · 聊天陪伴 ¥50',
      role: 'family',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'act-2',
      kind: 'outdoor_approved',
      title: '外出待审批',
      detail: '李爷爷 · 外出陪同',
      role: 'family',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ] satisfies ActivityEvent[],
};

export const GUEST_STUDENT_PREVIEW = {
  profileName: DEMO_USERS.student.nickname,
  schoolName: '示范大学',
  pendingCount: orders.filter((o) => o.status === 'pending_accept').length,
  activeCount: orders.filter((o) => o.status === 'in_service').length,
  stats: {
    pendingCount: 10,
    activeCount: 2,
    incomeCents: 28500,
    incomeYuan: '285.00',
  } satisfies StudentStats,
  withdrawAvailableYuan: '120.00',
  sosAlerts: [
    {
      id: 'sos-preview-1',
      elderId: 'elder-1',
      elderName: '张奶奶',
      message: '演示求助 · 请保持电话畅通',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ],
  previewElders: elders.slice(0, 2).map((e) => ({
    id: e.id,
    name: e.name,
    orgName: e.org === DEMO_ORG_MAIN.id ? DEMO_ORG_MAIN.name : '城东颐养中心',
    distanceKm: 0.8 + elders.indexOf(e) * 0.4,
    tags: e.tags,
  })),
};

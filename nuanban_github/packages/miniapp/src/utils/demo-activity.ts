/** 测试版 · 撮合动态事件（订单/支付/SOS 等状态变更留痕） */

export type ActivityKind =
  | 'order_created'
  | 'order_paid'
  | 'order_accepted'
  | 'order_rejected'
  | 'outdoor_approved'
  | 'outdoor_rejected'
  | 'checkin'
  | 'order_completed'
  | 'order_confirmed'
  | 'sos_triggered'
  | 'sos_ack'
  | 'dispatch'
  | 'package_purchased'
  | 'scenario_seeded';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  role?: 'student' | 'family' | 'elder' | 'platform';
  orderId?: string;
  createdAt: string;
}

const KIND_ICON: Record<ActivityKind, string> = {
  order_created: '📋',
  order_paid: '💳',
  order_accepted: '✅',
  order_rejected: '↩️',
  outdoor_approved: '🚶',
  outdoor_rejected: '⛔',
  checkin: '📍',
  order_completed: '🏁',
  order_confirmed: '🎉',
  sos_triggered: '🆘',
  sos_ack: '✓',
  dispatch: '🏢',
  package_purchased: '📦',
  scenario_seeded: '✨',
};

export function activityIcon(kind: ActivityKind) {
  return KIND_ICON[kind] || '·';
}

export function buildSeedActivities(): ActivityEvent[] {
  const now = Date.now();
  const t = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();
  return [
    {
      id: 'act-seed-1',
      kind: 'order_confirmed',
      title: '张奶奶 · 聊天陪伴已确认',
      detail: '家属确认完成，服务记录已归档',
      role: 'family',
      orderId: 'order-completed-1',
      createdAt: t(180),
    },
    {
      id: 'act-seed-2',
      kind: 'order_accepted',
      title: '林同学接受陪聊订单',
      detail: '李爷爷 · 读报陪聊 · 待签到',
      role: 'student',
      createdAt: t(90),
    },
    {
      id: 'act-seed-3',
      kind: 'order_paid',
      title: '家属储值卡支付',
      detail: '王阿姨康复协助 ¥80.00',
      role: 'family',
      createdAt: t(45),
    },
    {
      id: 'act-seed-4',
      kind: 'outdoor_approved',
      title: '外出陪同已批准',
      detail: '陪同散步 · 张奶奶',
      role: 'family',
      createdAt: t(20),
    },
  ];
}

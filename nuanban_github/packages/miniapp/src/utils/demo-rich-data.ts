/**
 * 公网演示富数据集 — 多老人/多订单/多状态，用于界面与压力场景测试（零后端成本）
 */

export const DEMO_ORG_MAIN = { id: 'org-demo', name: '暖伴示范养老院' };
export const DEMO_ORG_EAST = { id: 'org-east', name: '城东颐养中心' };

export const DEMO_USERS = {
  student: { id: 'user-student', email: 'student1@test.nuanban.dev', nickname: '林同学' },
  family: { id: 'user-family', email: 'family1@test.nuanban.dev', nickname: '家属1' },
  elder: { id: 'user-elder', email: 'elder1@test.nuanban.dev', nickname: '老人1' },
} as const;

export type RichOrderStatus =
  | 'pending_accept'
  | 'pending_payment'
  | 'outdoor_pending'
  | 'pending_service'
  | 'in_service'
  | 'completed'
  | 'cancelled';

export interface RichElder {
  id: string;
  name: string;
  age: number;
  tags: string[];
  latitude: number;
  longitude: number;
  org: string;
  intro: string;
}

export interface RichCaregiver {
  id: string;
  userId: string;
  name: string;
  school: string;
  distanceKm: number;
  tags: string[];
  rating: number;
  orderCount: number;
  intro: string;
}

export interface RichOrder {
  id: string;
  elder: string;
  service_item: string;
  status: RichOrderStatus;
  amount_cents: number;
  payment_status: string;
  family_user: string;
  student_user?: string;
  scheduled_at: string;
}

export interface RichServiceLog {
  id: string;
  orderId: string;
  elderId: string;
  elderName: string;
  serviceName: string;
  summary: string;
  createdAt: string;
}

const SERVICE_IDS = [
  'svc-chat',
  'svc-read',
  'svc-chess',
  'svc-life',
  'svc-med',
  'svc-rehab',
  'svc-finger',
  'svc-walk',
  'svc-hospital',
  'svc-shop',
] as const;

const ELDER_NAMES = [
  ['张奶奶', 78, ['行动便利', '喜欢聊天']],
  ['李爷爷', 82, ['需康复协助', '耳背']],
  ['王阿姨', 75, ['独居', '用药提醒']],
  ['赵伯伯', 80, ['棋牌爱好者', '健谈']],
  ['刘奶奶', 77, ['术后康复', '需搀扶']],
  ['陈爷爷', 84, ['阿尔茨海默早期', '需耐心']],
  ['周阿姨', 73, ['喜欢散步', '性格开朗']],
  ['吴爷爷', 79, ['耳背', '喜欢听戏']],
] as const;

export function buildRichElders(): RichElder[] {
  const baseLat = 31.2304;
  const baseLng = 121.4737;
  return ELDER_NAMES.map(([name, age, tags], i) => ({
    id: `elder-${i + 1}`,
    name,
    age,
    tags: [...tags],
    latitude: baseLat + (i % 4) * 0.004 - 0.006,
    longitude: baseLng + (i % 3) * 0.005 - 0.004,
    org: i < 5 ? DEMO_ORG_MAIN.id : DEMO_ORG_EAST.id,
    intro: `${name}的演示档案，用于列表滚动与地图多点测试。`,
  }));
}

/** 兼容旧 id：elder-zhang 等映射到 elder-1 */
export function normalizeElderId(id: string, elders: RichElder[]): string {
  const legacy: Record<string, string> = {
    'elder-zhang': 'elder-1',
    'elder-li': 'elder-2',
    'elder-wang': 'elder-3',
  };
  const mapped = legacy[id] || id;
  return elders.some((e) => e.id === mapped) ? mapped : elders[0]?.id || id;
}

export function buildRichCaregivers(): RichCaregiver[] {
  const schools = ['示范大学', '城东师范学院', '医科大学', '示范大学'];
  const names = ['林同学', '陈同学', '赵同学', '孙同学', '周同学', '吴同学'];
  return names.map((name, i) => ({
    id: `cg-${i + 1}`,
    userId: i === 0 ? DEMO_USERS.student.id : `user-student-${i + 1}`,
    name,
    school: schools[i % schools.length],
    distanceKm: 0.5 + i * 0.55,
    tags: [['陪伴聊天', '康复协助'], ['生活陪护'], ['棋牌陪伴'], ['外出陪同'], ['读报陪聊'], ['用药提醒']][i] || [
      '陪伴',
    ],
    rating: 4.9 - i * 0.05,
    orderCount: 35 - i * 4,
    intro: `${name}——富数据演示陪护学生 #${i + 1}`,
  }));
}

export function buildRichOrders(elders: RichElder[]): RichOrder[] {
  const now = Date.now();
  const family = DEMO_USERS.family.id;
  const student = DEMO_USERS.student.id;
  const orders: RichOrder[] = [];
  let seq = 1;

  const push = (
    elderIdx: number,
    svcIdx: number,
    status: RichOrderStatus,
    offsetMs: number,
    extra?: Partial<RichOrder>,
  ) => {
    const elder = elders[elderIdx % elders.length];
    orders.push({
      id: `order-rich-${seq++}`,
      elder: elder.id,
      service_item: SERVICE_IDS[svcIdx % SERVICE_IDS.length],
      status,
      amount_cents: [3500, 5000, 6500, 7000, 8000, 12000][svcIdx % 6],
      payment_status: status === 'pending_payment' ? 'unpaid' : 'paid',
      family_user: family,
      scheduled_at: new Date(now + offsetMs).toISOString(),
      ...extra,
    });
  };

  // 待接单池（压力：6 单）
  for (let i = 0; i < 6; i++) push(i, i, 'pending_accept', 86400000 * (1 + i * 0.3));

  // 待支付（3 单）
  for (let i = 0; i < 3; i++) push(i + 1, i + 2, 'pending_payment', 172800000 + i * 3600000);

  // 外出待批（2 单）
  push(2, 7, 'outdoor_pending', 259200000);
  push(4, 8, 'outdoor_pending', 302400000);

  // 待服务 + 服务中（学生）
  push(0, 3, 'pending_service', 7200000, { student_user: student });
  push(1, 4, 'pending_service', 10800000, { student_user: student });
  push(0, 3, 'in_service', -3600000, { student_user: student });

  // 已完成历史（收入压力：8 单）
  for (let i = 0; i < 8; i++) {
    push(i, i + 1, 'completed', -86400000 * (i + 1), { student_user: student });
  }

  // 已取消（1 单）
  push(5, 2, 'cancelled', -43200000);

  // 保留旧 id 别名，避免深链与文档用例失效
  orders[0].id = 'order-pending-accept';
  orders[1].id = 'order-pending-accept-2';
  const pay = orders.find((o) => o.status === 'pending_payment');
  const outdoor = orders.find((o) => o.status === 'outdoor_pending');
  const inSvc = orders.find((o) => o.status === 'in_service');
  const done = orders.find((o) => o.status === 'completed');
  if (pay) pay.id = 'order-pending-payment';
  if (outdoor) outdoor.id = 'order-outdoor-pending';
  if (inSvc) inSvc.id = 'order-in-service-1';
  if (done) done.id = 'order-completed-1';

  return orders;
}

export function buildServiceLogs(orders: RichOrder[], elderName: (id: string) => string): RichServiceLog[] {
  const summaries = [
    '陪老人读报 45 分钟，情绪稳定',
    '完成康复操一组，记录血压正常',
    '陪同散步至小区花园，往返约 1km',
    '用药提醒已执行，老人已服药',
    '棋牌陪伴，老人兴致良好',
  ];
  return orders
    .filter((o) => o.status === 'completed')
    .map((o, i) => ({
      id: `log-${o.id}`,
      orderId: o.id,
      elderId: o.elder,
      elderName: elderName(o.elder),
      serviceName: o.service_item,
      summary: summaries[i % summaries.length],
      createdAt: o.scheduled_at,
    }));
}

export function orgNameById(orgId: string): string {
  if (orgId === DEMO_ORG_EAST.id) return DEMO_ORG_EAST.name;
  return DEMO_ORG_MAIN.name;
}

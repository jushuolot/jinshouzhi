import type { RoleKey } from '../config/tabs';

/** GitHub Pages 公网演示：纯前端 Mock，无需 PocketBase / Render */
const MOCK_TOKEN = 'demo-mock-token';

const USERS = {
  student: { id: 'user-student', email: 'student1@test.nuanban.dev', nickname: '林同学' },
  family: { id: 'user-family', email: 'family1@test.nuanban.dev', nickname: '家属1' },
  elder: { id: 'user-elder', email: 'elder1@test.nuanban.dev', nickname: '老人1' },
} as const;

const ORG = { id: 'org-demo', name: '暖伴示范养老院' };

const ELDERS = [
  {
    id: 'elder-zhang',
    name: '张奶奶',
    age: 78,
    tags: ['行动便利', '喜欢聊天'],
    latitude: 31.2304,
    longitude: 121.4737,
    org: ORG.id,
    intro: '退休教师，性格温和，喜欢读报和下棋，希望有同学来陪聊。',
  },
  {
    id: 'elder-li',
    name: '李爷爷',
    age: 82,
    tags: ['需康复协助', '耳背'],
    latitude: 31.235,
    longitude: 121.48,
    org: ORG.id,
    intro: '需辅助康复操与外出陪同，家属希望每次服务有记录。',
  },
  {
    id: 'elder-wang',
    name: '王阿姨',
    age: 75,
    tags: ['独居', '用药提醒'],
    latitude: 31.228,
    longitude: 121.469,
    org: ORG.id,
    intro: '独居，需要定期用药提醒与生活陪护。',
  },
];

const CAREGIVERS = [
  {
    id: 'cg-1',
    userId: USERS.student.id,
    name: '林同学',
    school: '示范大学',
    distanceKm: 0.8,
    tags: ['陪伴聊天', '康复协助'],
    rating: 4.9,
    orderCount: 28,
    intro: '社会工作专业大三，有养老院志愿服务经验，耐心细致。',
  },
  {
    id: 'cg-2',
    userId: 'user-student-2',
    name: '陈同学',
    school: '示范大学',
    distanceKm: 1.2,
    tags: ['生活陪护', '读报陪聊'],
    rating: 4.8,
    orderCount: 19,
    intro: '护理学院在读，擅长生活照料与读报陪伴。',
  },
  {
    id: 'cg-3',
    userId: 'user-student-3',
    name: '赵同学',
    school: '城东师范学院',
    distanceKm: 2.1,
    tags: ['棋牌陪伴', '手指操'],
    rating: 4.7,
    orderCount: 12,
    intro: '喜欢与长辈下棋聊天，康复协助培训合格。',
  },
  {
    id: 'cg-4',
    userId: 'user-student-4',
    name: '孙同学',
    school: '示范大学',
    distanceKm: 3.4,
    tags: ['外出陪同', '超市代购'],
    rating: 4.9,
    orderCount: 35,
    intro: '勤工之星，外出陪同与就医陪护经验丰富。',
  },
];

const SERVICE_CATEGORIES = [
  { id: 'cat-companion', name: '陪伴聊天', sort_order: 1 },
  { id: 'cat-care', name: '生活陪护', sort_order: 2 },
  { id: 'cat-rehab', name: '康复协助', sort_order: 3 },
  { id: 'cat-outdoor', name: '外出陪同', sort_order: 4 },
] as const;

const SERVICE_ITEMS = [
  { id: 'svc-chat', category: 'cat-companion', name: '聊天陪伴', price_cents: 5000, duration_minutes: 60, requires_outdoor_approval: false },
  { id: 'svc-read', category: 'cat-companion', name: '读报陪聊', price_cents: 4000, duration_minutes: 45, requires_outdoor_approval: false },
  { id: 'svc-chess', category: 'cat-companion', name: '棋牌陪伴', price_cents: 6000, duration_minutes: 90, requires_outdoor_approval: false },
  { id: 'svc-life', category: 'cat-care', name: '生活陪护', price_cents: 7000, duration_minutes: 60, requires_outdoor_approval: false },
  { id: 'svc-med', category: 'cat-care', name: '用药提醒', price_cents: 3500, duration_minutes: 30, requires_outdoor_approval: false },
  { id: 'svc-rehab', category: 'cat-rehab', name: '辅助康复操', price_cents: 8000, duration_minutes: 60, requires_outdoor_approval: false },
  { id: 'svc-finger', category: 'cat-rehab', name: '手指操陪练', price_cents: 4500, duration_minutes: 30, requires_outdoor_approval: false },
  { id: 'svc-walk', category: 'cat-outdoor', name: '陪同散步', price_cents: 6500, duration_minutes: 60, requires_outdoor_approval: true },
  { id: 'svc-hospital', category: 'cat-outdoor', name: '陪同就医', price_cents: 12000, duration_minutes: 120, requires_outdoor_approval: true },
  { id: 'svc-shop', category: 'cat-outdoor', name: '超市代购陪同', price_cents: 8000, duration_minutes: 90, requires_outdoor_approval: true },
] as const;

type OrderStatus =
  | 'pending_accept'
  | 'pending_payment'
  | 'outdoor_pending'
  | 'pending_service'
  | 'in_service'
  | 'accepted'
  | 'completed'
  | 'paid'
  | 'cancelled';

interface MockSosAlert {
  id: string;
  elder: string;
  message: string;
  status: 'active' | 'acknowledged';
  created_at: string;
}

interface MockOrder {
  id: string;
  elder: string;
  service_item: string;
  status: OrderStatus;
  amount_cents: number;
  payment_status: string;
  family_user: string;
  student_user?: string;
  scheduled_at: string;
}

interface MockOutdoorApproval {
  id: string;
  order: string;
  status: string;
  family_user: string;
}

function serviceById(id: string) {
  return SERVICE_ITEMS.find((s) => s.id === id) || SERVICE_ITEMS[0];
}

function elderById(id: string) {
  return ELDERS.find((e) => e.id === id);
}

function serviceRecord(s: (typeof SERVICE_ITEMS)[number]) {
  const cat = SERVICE_CATEGORIES.find((c) => c.id === s.category);
  return {
    id: s.id,
    collectionId: 'service_items',
    created: '',
    updated: '',
    name: s.name,
    price_cents: s.price_cents,
    duration_minutes: s.duration_minutes,
    requires_outdoor_approval: s.requires_outdoor_approval,
    enabled: true,
    category: s.category,
    expand: { category: { id: s.category, name: cat?.name || '其他服务' } },
  };
}

function formatKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function caregiverToListItem(c: (typeof CAREGIVERS)[0]) {
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    school: c.school,
    distance: formatKm(c.distanceKm),
    distanceKm: c.distanceKm,
    tags: c.tags,
    rating: c.rating,
    orderCount: c.orderCount,
    intro: c.intro,
  };
}

const state = {
  orders: [
    {
      id: 'order-pending-accept',
      elder: 'elder-zhang',
      service_item: 'svc-chat',
      status: 'pending_accept' as OrderStatus,
      amount_cents: 5000,
      payment_status: 'paid',
      family_user: USERS.family.id,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'order-pending-accept-2',
      elder: 'elder-wang',
      service_item: 'svc-med',
      status: 'pending_accept' as OrderStatus,
      amount_cents: 3500,
      payment_status: 'paid',
      family_user: USERS.family.id,
      scheduled_at: new Date(Date.now() + 43200000).toISOString(),
    },
    {
      id: 'order-pending-payment',
      elder: 'elder-li',
      service_item: 'svc-rehab',
      status: 'pending_payment' as OrderStatus,
      amount_cents: 8000,
      payment_status: 'unpaid',
      family_user: USERS.family.id,
      scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    },
    {
      id: 'order-outdoor-pending',
      elder: 'elder-li',
      service_item: 'svc-walk',
      status: 'outdoor_pending' as OrderStatus,
      amount_cents: 6500,
      payment_status: 'paid',
      family_user: USERS.family.id,
      scheduled_at: new Date(Date.now() + 259200000).toISOString(),
    },
    {
      id: 'order-in-service-1',
      elder: 'elder-zhang',
      service_item: 'svc-life',
      status: 'in_service' as OrderStatus,
      amount_cents: 7000,
      payment_status: 'paid',
      family_user: USERS.family.id,
      student_user: USERS.student.id,
      scheduled_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'order-completed-1',
      elder: 'elder-zhang',
      service_item: 'svc-rehab',
      status: 'completed' as OrderStatus,
      amount_cents: 8000,
      payment_status: 'paid',
      family_user: USERS.family.id,
      student_user: USERS.student.id,
      scheduled_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ] as MockOrder[],
  sosAlerts: [] as MockSosAlert[],
  outdoorApprovals: [
    {
      id: 'outdoor-approval-1',
      order: 'order-outdoor-pending',
      status: 'pending_family',
      family_user: USERS.family.id,
    },
  ] as MockOutdoorApproval[],
};

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), 120));
}

function roleFromEmail(email: string): RoleKey {
  const e = email.toLowerCase();
  if (e.includes('elder')) return 'elder';
  if (e.includes('family')) return 'family';
  return 'student';
}

function loginByEmail(email: string) {
  const role = roleFromEmail(email);
  const user = USERS[role];
  const roles: { role: RoleKey; status: string; elderProfileId?: string | null }[] = [
    {
      role,
      status: 'active',
      elderProfileId: role === 'elder' ? 'elder-zhang' : null,
    },
  ];
  return {
    token: MOCK_TOKEN,
    user: { id: user.id, nickname: user.nickname, email: user.email },
    roles,
    activeRole: role,
  };
}

function pbList<T>(items: T[]) {
  return { page: 1, perPage: 50, totalItems: items.length, totalPages: 1, items };
}

function elderRecord(e: (typeof ELDERS)[0]) {
  return {
    id: e.id,
    collectionId: 'elders',
    created: '',
    updated: '',
    name: e.name,
    age: e.age,
    tags: e.tags,
    intro: e.intro,
    latitude: e.latitude,
    longitude: e.longitude,
    enabled: true,
    org: e.org,
    expand: { org: { id: ORG.id, name: ORG.name } },
  };
}

function orderRecord(o: MockOrder) {
  const elder = elderById(o.elder);
  const svc = serviceById(o.service_item);
  return {
    id: o.id,
    collectionId: 'orders',
    created: '',
    updated: '',
    status: o.status,
    elder: o.elder,
    service_item: o.service_item,
    amount_cents: o.amount_cents,
    payment_status: o.payment_status,
    scheduled_at: o.scheduled_at,
    expand: {
      elder: elder ? { id: elder.id, name: elder.name } : undefined,
      service_item: {
        id: svc.id,
        name: svc.name,
        price_cents: svc.price_cents,
        duration_minutes: svc.duration_minutes,
        requires_outdoor_approval: svc.requires_outdoor_approval,
      },
    },
  };
}

function pendingOrderDto(o: MockOrder) {
  const elder = elderById(o.elder);
  const svc = serviceById(o.service_item);
  return {
    id: o.id,
    elderId: o.elder,
    elderName: elder?.name || '老人',
    serviceName: svc.name,
    durationMinutes: svc.duration_minutes,
    amountCents: o.amount_cents,
    scheduledAt: o.scheduled_at,
    status: o.status,
    requiresOutdoorApproval: svc.requires_outdoor_approval,
    distanceKm: elder ? 1.2 : undefined,
    orgName: ORG.name,
    elderIntro: elder?.intro,
  };
}

function sosDto(a: MockSosAlert) {
  const elder = elderById(a.elder);
  return {
    id: a.id,
    elderId: a.elder,
    elderName: elder?.name || '老人',
    message: a.message,
    createdAt: a.created_at,
    status: a.status,
  };
}

function parsePath(url: string): { path: string; query: URLSearchParams } {
  const u = url.includes('://') ? new URL(url) : new URL(url, 'http://mock.local');
  return { path: u.pathname.replace(/^\/api/, ''), query: u.searchParams };
}

function parseBody(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return data as Record<string, unknown>;
}

/** 构建时 VITE_DEMO_MOCK，或运行在 GitHub Pages 时自动启用 */
export function isDemoMockEnabled(): boolean {
  if (import.meta.env.VITE_DEMO_MOCK === 'true') return true;
  try {
    if (typeof window !== 'undefined' && window.location) {
      const { hostname, pathname } = window.location;
      if (hostname.endsWith('.github.io') && pathname.includes('/nuanban')) {
        return true;
      }
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function demoMockRequest<T>(options: UniApp.RequestOptions): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const rawUrl = options.url || '';
  const { path, query } = parsePath(rawUrl.startsWith('http') ? rawUrl : `/api${rawUrl}`);
  const data = parseBody(options.data);

  if (method === 'POST' && path === '/nuanban/dev-login') {
    const email = String(data.email || 'student1@test.nuanban.dev');
    return delay(loginByEmail(email) as T);
  }

  if (method === 'POST' && path === '/nuanban/wx-login') {
    return delay(loginByEmail('student1@test.nuanban.dev') as T);
  }

  if (method === 'GET' && path === '/nuanban/student/profile') {
    return delay({
      nickname: USERS.student.nickname,
      email: USERS.student.email,
      schoolName: '示范大学',
      displayName: '林同学',
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/stats') {
    const completed = state.orders.filter((o) => o.status === 'completed' && o.student_user === USERS.student.id);
    const pending = state.orders.filter((o) => o.status === 'pending_accept').length;
    const income = completed.reduce((s, o) => s + o.amount_cents, 0);
    return delay({
      acceptedCount: completed.length + 1,
      monthCount: completed.length,
      pendingCount: pending,
      incomeCents: income,
      incomeYuan: (income / 100).toFixed(2),
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/orders/pending') {
    const list = state.orders.filter((o) => o.status === 'pending_accept').map(pendingOrderDto);
    return delay({ list } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/orders/active') {
    const list = state.orders
      .filter((o) => o.status === 'pending_service' || o.status === 'in_service')
      .filter((o) => o.student_user === USERS.student.id || !o.student_user)
      .map(pendingOrderDto);
    return delay({ list } as T);
  }
  const studentOrderGet = path.match(/^\/nuanban\/student\/orders\/([^/]+)$/);
  if (method === 'GET' && studentOrderGet && !studentOrderGet[1].includes('active')) {
    const order = state.orders.find((o) => o.id === studentOrderGet[1]);
    if (!order) return Promise.reject({ message: '订单不存在' });
    return delay(pendingOrderDto(order) as T);
  }
  const studentOrderStart = path.match(/^\/nuanban\/student\/orders\/([^/]+)\/start$/);
  if (method === 'POST' && studentOrderStart) {
    const order = state.orders.find((o) => o.id === studentOrderStart[1]);
    if (order && order.status === 'pending_service') order.status = 'in_service';
    return delay({ ok: true, status: order?.status || 'in_service' } as T);
  }
  const studentOrderComplete = path.match(/^\/nuanban\/student\/orders\/([^/]+)\/complete$/);
  if (method === 'POST' && studentOrderComplete) {
    const order = state.orders.find((o) => o.id === studentOrderComplete[1]);
    if (order && order.status === 'in_service') {
      order.status = 'completed';
      order.student_user = USERS.student.id;
    }
    return delay({ ok: true, status: order?.status || 'completed' } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/income') {
    const completed = state.orders.filter(
      (o) => o.status === 'completed' && o.student_user === USERS.student.id,
    );
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let monthIncome = 0;
    let totalIncome = 0;
    const records = completed.map((o) => {
      const elder = elderById(o.elder);
      const svc = serviceById(o.service_item);
      totalIncome += o.amount_cents;
      if (o.scheduled_at.startsWith(monthPrefix)) monthIncome += o.amount_cents;
      return {
        id: o.id,
        elderName: elder?.name || '老人',
        serviceName: svc.name,
        amountCents: o.amount_cents,
        completedAt: o.scheduled_at,
      };
    });
    return delay({
      monthIncomeCents: monthIncome,
      monthIncomeYuan: (monthIncome / 100).toFixed(2),
      totalIncomeCents: totalIncome,
      totalIncomeYuan: (totalIncome / 100).toFixed(2),
      records: records.reverse(),
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/sos/active') {
    const list = state.sosAlerts.filter((a) => a.status === 'active').map(sosDto);
    return delay({ list } as T);
  }
  const studentSosAck = path.match(/^\/nuanban\/student\/sos\/([^/]+)\/ack$/);
  if (method === 'POST' && studentSosAck) {
    const alert = state.sosAlerts.find((a) => a.id === studentSosAck[1]);
    if (alert) alert.status = 'acknowledged';
    return delay({ ok: true } as T);
  }

  const orderAction = path.match(/\/nuanban\/student\/order-requests\/([^/]+)\/(accept|reject)/);
  if (method === 'POST' && orderAction) {
    const id = orderAction[1];
    const action = orderAction[2];
    const order = state.orders.find((o) => o.id === id);
    if (order && action === 'accept') {
      order.status = 'pending_service';
      order.student_user = USERS.student.id;
    }
    return delay({ ok: true, status: order?.status || 'pending_service' } as T);
  }

  if (method === 'GET' && path === '/nuanban/family/stats') {
    const pendingPay = state.orders.filter((o) => o.status === 'pending_payment').length;
    const outdoorPending = state.outdoorApprovals.filter((a) => a.status === 'pending_family').length;
    const sosPending = state.sosAlerts.filter((a) => a.status === 'active').length;
    return delay({
      boundElderCount: ELDERS.length,
      pendingPaymentCount: pendingPay,
      outdoorPendingCount: outdoorPending,
      sosPendingCount: sosPending,
      paidTotalCents: 14500,
      paidTotalYuan: '145.00',
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/family/sos/active') {
    const list = state.sosAlerts.filter((a) => a.status === 'active').map(sosDto);
    return delay({ list } as T);
  }
  const familySosAck = path.match(/^\/nuanban\/family\/sos\/([^/]+)\/ack$/);
  if (method === 'POST' && familySosAck) {
    const alert = state.sosAlerts.find((a) => a.id === familySosAck[1]);
    if (alert) alert.status = 'acknowledged';
    return delay({ ok: true } as T);
  }
  if (method === 'POST' && path.match(/\/nuanban\/family\/orders\/[^/]+\/pay/)) {
    const id = path.split('/')[4];
    const order = state.orders.find((o) => o.id === id);
    if (order) {
      order.status = 'pending_accept';
      order.payment_status = 'paid';
    }
    return delay({ ok: true, status: order?.status || 'pending_accept' } as T);
  }
  if (method === 'POST' && path.match(/\/nuanban\/family\/outdoor\/[^/]+\/approve/)) {
    const id = path.split('/')[4];
    const approved = data.approved !== false;
    const approval = state.outdoorApprovals.find((a) => a.order === id || a.id === id);
    const order = state.orders.find((o) => o.id === (approval?.order || id));
    if (approval) approval.status = approved ? 'approved' : 'rejected';
    if (order) {
      order.status = approved ? 'pending_service' : 'cancelled';
    }
    return delay({ ok: true, approved } as T);
  }

  if (method === 'GET' && path === '/nuanban/elder/stats') {
    const elderOrders = state.orders.filter((o) => o.elder === 'elder-zhang');
    return delay({
      elderProfileId: 'elder-zhang',
      elderName: '张奶奶',
      orderCount: elderOrders.length,
      activeCount: elderOrders.filter((o) =>
        ['pending_accept', 'pending_service', 'in_service', 'outdoor_pending'].includes(o.status),
      ).length,
      caregiverNearbyCount: CAREGIVERS.length,
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/elder/caregivers/nearby') {
    return delay({ list: CAREGIVERS.map(caregiverToListItem) } as T);
  }
  if (method === 'POST' && path === '/nuanban/elder/sos') {
    const elderId = String(data.elderId || 'elder-zhang');
    const id = `sos-${Date.now()}`;
    state.sosAlerts.unshift({
      id,
      elder: elderId,
      message: String(data.message || '老人发起一键求助'),
      status: 'active',
      created_at: new Date().toISOString(),
    });
    return delay({ id, ok: true } as T);
  }
  if (method === 'POST' && path === '/nuanban/elder/orders') {
    const id = `order-${Date.now()}`;
    const svc = serviceById(String(data.serviceItemId || 'svc-chat'));
    const needsOutdoor = svc.requires_outdoor_approval;
    state.orders.push({
      id,
      elder: String(data.elderId || 'elder-zhang'),
      service_item: svc.id,
      status: needsOutdoor ? 'outdoor_pending' : 'pending_payment',
      amount_cents: svc.price_cents,
      payment_status: 'unpaid',
      family_user: USERS.family.id,
      scheduled_at: new Date().toISOString(),
    });
    if (needsOutdoor) {
      state.outdoorApprovals.push({
        id: `outdoor-${Date.now()}`,
        order: id,
        status: 'pending_family',
        family_user: USERS.family.id,
      });
    }
    return delay({ id, status: needsOutdoor ? 'outdoor_pending' : 'pending_payment' } as T);
  }

  if (method === 'GET' && path.startsWith('/collections/elders/records')) {
    const filter = query.get('filter') || '';
    let items = ELDERS.map(elderRecord);
    if (filter.includes('id =')) {
      const id = filter.match(/id = "([^"]+)"/)?.[1];
      items = items.filter((e) => e.id === id);
    }
    return delay(pbList(items) as T);
  }
  if (method === 'GET' && path.startsWith('/collections/family_elder_bindings/records')) {
    const items = ELDERS.map((e) => ({
      id: `bind-${e.id}`,
      collectionId: 'family_elder_bindings',
      created: '',
      updated: '',
      elder: e.id,
      family_user: USERS.family.id,
      relation_label: e.id === 'elder-zhang' ? '女儿' : '儿子',
      expand: { elder: { id: e.id, name: e.name } },
    }));
    return delay(pbList(items) as T);
  }
  if (method === 'GET' && path.startsWith('/collections/outdoor_approvals/records')) {
    const items = state.outdoorApprovals
      .filter((a) => a.status === 'pending_family')
      .map((a) => {
        const order = state.orders.find((o) => o.id === a.order);
        const elder = order ? elderById(order.elder) : null;
        const svc = order ? serviceById(order.service_item) : null;
        return {
          id: a.id,
          collectionId: 'outdoor_approvals',
          created: '',
          updated: '',
          order: a.order,
          status: a.status,
          family_user: a.family_user,
          expand: {
            order: order
              ? {
                  id: order.id,
                  scheduled_at: order.scheduled_at,
                  amount_cents: order.amount_cents,
                  expand: {
                    elder: elder ? { id: elder.id, name: elder.name } : undefined,
                    service_item: svc ? { id: svc.id, name: svc.name } : undefined,
                  },
                }
              : undefined,
          },
        };
      });
    return delay(pbList(items) as T);
  }
  if (method === 'GET' && path.startsWith('/collections/orders/records')) {
    const one = path.match(/^\/collections\/orders\/records\/([^/?]+)$/);
    if (one) {
      const order = state.orders.find((o) => o.id === one[1]);
      if (!order) return Promise.reject({ message: '订单不存在' });
      return delay(orderRecord(order) as T);
    }
    let items = state.orders.map(orderRecord);
    const filter = query.get('filter') || '';
    if (filter.includes('pending_payment')) {
      items = items.filter((o) => o.status === 'pending_payment');
    } else if (filter.includes('elder =')) {
      const elderId = filter.match(/elder = "([^"]+)"/)?.[1];
      if (elderId) items = items.filter((o) => o.elder === elderId);
    } else if (filter.includes('id =')) {
      const id = filter.match(/id = "([^"]+)"/)?.[1];
      items = items.filter((o) => o.id === id);
    }
    return delay(pbList(items) as T);
  }
  if (method === 'GET' && path.startsWith('/collections/service_items/records')) {
    return delay(pbList(SERVICE_ITEMS.map(serviceRecord)) as T);
  }

  if (method === 'GET' && path === '/nuanban/auth/me') {
    return delay({ roles: [{ role: 'student', status: 'active' }] } as T);
  }

  return Promise.reject({ message: `[演示模式] 未模拟: ${method} ${path}` });
}

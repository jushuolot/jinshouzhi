import type { RoleKey } from '../config/tabs';

/** GitHub Pages 公网演示：纯前端 Mock，无需 PocketBase / Render */
const MOCK_TOKEN = 'demo-mock-token';

const USERS = {
  student: { id: 'user-student', email: 'student1@test.nuanban.dev', nickname: '学生1' },
  family: { id: 'user-family', email: 'family1@test.nuanban.dev', nickname: '家属1' },
  elder: { id: 'user-elder', email: 'elder1@test.nuanban.dev', nickname: '老人1' },
} as const;

const ORG = { id: 'org-demo', name: '暖伴示范养老院' };

const ELDERS = [
  { id: 'elder-zhang', name: '张奶奶', latitude: 31.2304, longitude: 121.4737, org: ORG.id },
  { id: 'elder-li', name: '李爷爷', latitude: 31.235, longitude: 121.48, org: ORG.id },
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

function serviceById(id: string) {
  return SERVICE_ITEMS.find((s) => s.id === id) || SERVICE_ITEMS[0];
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

type OrderStatus = 'pending_accept' | 'pending_payment' | 'accepted' | 'completed' | 'paid';

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
      id: 'order-pending-payment',
      elder: 'elder-li',
      service_item: 'svc-walk',
      status: 'pending_payment' as OrderStatus,
      amount_cents: 6500,
      payment_status: 'unpaid',
      family_user: USERS.family.id,
      scheduled_at: new Date(Date.now() + 172800000).toISOString(),
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
    latitude: e.latitude,
    longitude: e.longitude,
    enabled: true,
    org: e.org,
    expand: { org: { id: ORG.id, name: ORG.name } },
  };
}

function orderRecord(o: MockOrder) {
  const elder = ELDERS.find((e) => e.id === o.elder);
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
      service_item: { id: svc.id, name: svc.name, price_cents: svc.price_cents },
    },
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

  // POST /nuanban/dev-login
  if (method === 'POST' && path === '/nuanban/dev-login') {
    const email = String(data.email || 'student1@test.nuanban.dev');
    return delay(loginByEmail(email) as T);
  }

  if (method === 'POST' && path === '/nuanban/wx-login') {
    return delay(loginByEmail('student1@test.nuanban.dev') as T);
  }

  // GET /nuanban/student/*
  if (method === 'GET' && path === '/nuanban/student/profile') {
    return delay({
      nickname: USERS.student.nickname,
      email: USERS.student.email,
      schoolName: '示范大学',
      displayName: '学生1',
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/stats') {
    const completed = state.orders.filter((o) => o.status === 'completed' && o.student_user === USERS.student.id);
    const income = completed.reduce((s, o) => s + o.amount_cents, 0);
    return delay({
      acceptedCount: completed.length + 1,
      monthCount: completed.length,
      incomeCents: income,
      incomeYuan: (income / 100).toFixed(2),
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/orders/pending') {
    const list = state.orders
      .filter((o) => o.status === 'pending_accept')
      .map((o) => ({
        id: o.id,
        elderId: o.elder,
        amountCents: o.amount_cents,
        scheduledAt: o.scheduled_at,
        status: o.status,
      }));
    return delay({ list } as T);
  }

  const orderAction = path.match(/\/nuanban\/student\/order-requests\/([^/]+)\/(accept|reject)/);
  if (method === 'POST' && orderAction) {
    const id = orderAction[1];
    const action = orderAction[2];
    const order = state.orders.find((o) => o.id === id);
    if (order && action === 'accept') order.status = 'accepted';
    return delay({ ok: true, status: order?.status || 'accepted' } as T);
  }

  // Family
  if (method === 'GET' && path === '/nuanban/family/stats') {
    const pending = state.orders.filter((o) => o.status === 'pending_payment').length;
    return delay({
      boundElderCount: 2,
      pendingPaymentCount: pending,
      paidTotalCents: 10000,
      paidTotalYuan: '100.00',
    } as T);
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

  // Elder
  if (method === 'GET' && path === '/nuanban/elder/stats') {
    return delay({
      elderProfileId: 'elder-zhang',
      elderName: '张奶奶',
      orderCount: state.orders.filter((o) => o.elder === 'elder-zhang').length,
      activeCount: 1,
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/elder/caregivers/nearby') {
    return delay({
      list: [
        { id: 'cg-1', userId: USERS.student.id, name: '学生1', school: '示范大学', distance: '0.8km', distanceKm: 0.8 },
      ],
    } as T);
  }
  if (method === 'POST' && path === '/nuanban/elder/orders') {
    const id = `order-${Date.now()}`;
    const svc = serviceById(String(data.serviceItemId || 'svc-chat'));
    state.orders.push({
      id,
      elder: String(data.elderId || 'elder-zhang'),
      service_item: svc.id,
      status: 'pending_payment',
      amount_cents: svc.price_cents,
      payment_status: 'unpaid',
      family_user: USERS.family.id,
      scheduled_at: new Date().toISOString(),
    });
    return delay({ id, status: 'pending_payment' } as T);
  }

  // PocketBase collections
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
      expand: { elder: { id: e.id, name: e.name } },
    }));
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

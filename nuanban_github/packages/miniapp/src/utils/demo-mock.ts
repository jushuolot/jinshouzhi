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

const SERVICE_ITEM = {
  id: 'svc-chat',
  name: '聊天陪伴',
  price_cents: 5000,
  duration_minutes: 60,
  enabled: true,
};

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
      service_item: SERVICE_ITEM.id,
      status: 'pending_accept' as OrderStatus,
      amount_cents: 5000,
      payment_status: 'paid',
      family_user: USERS.family.id,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'order-pending-payment',
      elder: 'elder-li',
      service_item: SERVICE_ITEM.id,
      status: 'pending_payment' as OrderStatus,
      amount_cents: 5000,
      payment_status: 'unpaid',
      family_user: USERS.family.id,
      scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    },
    {
      id: 'order-completed-1',
      elder: 'elder-zhang',
      service_item: SERVICE_ITEM.id,
      status: 'completed' as OrderStatus,
      amount_cents: 5000,
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
  };
}

function parsePath(url: string): { path: string; query: URLSearchParams } {
  const u = url.includes('://') ? new URL(url) : new URL(url, 'http://mock.local');
  return { path: u.pathname.replace(/^\/api/, ''), query: u.searchParams };
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
  const data = options.data as Record<string, unknown> | undefined;

  // POST /nuanban/dev-login
  if (method === 'POST' && path === '/nuanban/dev-login') {
    const email = String(data?.email || 'student1@test.nuanban.dev');
    return delay(loginByEmail(email) as T);
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
    state.orders.push({
      id,
      elder: String(data?.elderId || 'elder-zhang'),
      service_item: String(data?.serviceItemId || SERVICE_ITEM.id),
      status: 'pending_payment',
      amount_cents: 5000,
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
    return delay(
      pbList([
        {
          id: SERVICE_ITEM.id,
          collectionId: 'service_items',
          created: '',
          updated: '',
          ...SERVICE_ITEM,
        },
      ]) as T
    );
  }

  if (method === 'GET' && path === '/nuanban/auth/me') {
    return delay({ roles: [{ role: 'student', status: 'active' }] } as T);
  }

  return Promise.reject({ message: `[演示模式] 未模拟: ${method} ${path}` });
}

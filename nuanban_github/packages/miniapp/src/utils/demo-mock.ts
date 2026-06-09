import { APP_TAGLINE } from '../config/brand';
import { isGodViewUnlocked } from './god-view-auth';
import type { RoleKey } from '../config/tabs';
import {
  buildRichCaregivers,
  buildRichElders,
  buildRichOrders,
  buildServiceLogs,
  DEMO_ORG_MAIN,
  DEMO_USERS,
  normalizeElderId,
  orgNameById,
  SERVICE_PACKAGES,
  SETTLEMENTS,
  type SettlementRecord,
  type RichOrder,
  type RichServiceLog,
} from './demo-rich-data';

/** GitHub Pages 公网演示：纯前端 Mock，无需 PocketBase / Render */
const MOCK_TOKEN = 'demo-mock-token';

const USERS = DEMO_USERS;
const ORG = DEMO_ORG_MAIN;
const ELDERS = buildRichElders();
const CAREGIVERS = buildRichCaregivers();

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

type MockOrder = RichOrder;

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
  const nid = normalizeElderId(id, ELDERS);
  return ELDERS.find((e) => e.id === nid);
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

const studentProfileState = {
  displayName: '林同学',
  schoolName: '示范大学',
};

function currentSettlementPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function addToPendingSettlement(amountCents: number) {
  const period = currentSettlementPeriod();
  const pending = state.settlements.find((s) => s.period === period && s.status === 'pending');
  if (pending) {
    pending.amountCents += amountCents;
    return;
  }
  state.settlements.push({
    id: `stl-${period}-${Date.now()}`,
    period,
    amountCents,
    status: 'pending',
  });
}

const state = {
  orders: buildRichOrders(ELDERS) as MockOrder[],
  settlements: [...SETTLEMENTS] as SettlementRecord[],
  serviceLogs: [] as RichServiceLog[],
  sosAlerts: [
    {
      id: 'sos-seed-1',
      elder: 'elder-1',
      message: '演示：老人昨日求助已恢复（可新建 SOS 测试）',
      status: 'active' as const,
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
  ] as MockSosAlert[],
  outdoorApprovals: [] as MockOutdoorApproval[],
};

state.serviceLogs = buildServiceLogs(state.orders, (eid) => elderById(eid)?.name || '老人').map(
  (log) => ({
    ...log,
    serviceName: serviceById(log.serviceName).name,
  }),
);

state.orders
  .filter((o) => o.status === 'outdoor_pending')
  .forEach((o, i) => {
    state.outdoorApprovals.push({
      id: `outdoor-approval-${i + 1}`,
      order: o.id,
      status: 'pending_family',
      family_user: USERS.family.id,
    });
  });

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), 120));
}

function roleFromEmail(email: string): RoleKey {
  const e = email.toLowerCase();
  if (e.includes('elder')) return 'elder';
  if (e.includes('family')) return 'family';
  return 'student';
}

/** 演示手机号 → seed 邮箱；任意 11 位未映射号默认学生演示账号 */
const DEMO_PHONE_EMAIL: Record<string, string> = {
  '13800000001': 'student1@test.nuanban.dev',
  '13800000002': 'student2@test.nuanban.dev',
  '13800000003': 'student3@test.nuanban.dev',
  '13800000004': 'family1@test.nuanban.dev',
  '13800000005': 'elder1@test.nuanban.dev',
  '13800000006': 'multi1@test.nuanban.dev',
};

function emailFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return DEMO_PHONE_EMAIL[digits] || 'student1@test.nuanban.dev';
}

type DemoAuthRole = {
  role: RoleKey;
  status: string;
  elderProfileId?: string | null;
};

const mockRegisterRoles: DemoAuthRole[] = [];

const DEMO_STORAGE_ROLES = 'roles';
const DEMO_STORAGE_USER = 'user';

function readStoredRoles(): DemoAuthRole[] {
  try {
    const stored = uni.getStorageSync(DEMO_STORAGE_ROLES);
    if (Array.isArray(stored) && stored.length) return stored as DemoAuthRole[];
  } catch {
    /* ignore */
  }
  return [];
}

function syncMockRolesFromStorage() {
  const stored = readStoredRoles();
  if (stored.length && !mockRegisterRoles.length) {
    mockRegisterRoles.push(...stored);
  }
}

function persistDemoRoles(roles: DemoAuthRole[], user?: { id: string; nickname: string; email: string }) {
  mockRegisterRoles.length = 0;
  mockRegisterRoles.push(...roles);
  try {
    uni.setStorageSync(DEMO_STORAGE_ROLES, roles);
    if (user) uni.setStorageSync(DEMO_STORAGE_USER, user);
  } catch {
    /* ignore */
  }
}

function demoUserForRoles(roles: DemoAuthRole[]) {
  try {
    const stored = uni.getStorageSync(DEMO_STORAGE_USER) as { id: string; nickname: string; email: string };
    if (stored?.id) return stored;
  } catch {
    /* ignore */
  }
  if (roles.some((r) => r.role === 'student' && r.status === 'active')) {
    return {
      ...DEMO_USERS.student,
      nickname: studentProfileState.displayName || DEMO_USERS.student.nickname,
    };
  }
  if (roles.some((r) => r.role === 'family')) return DEMO_USERS.family;
  if (roles.some((r) => r.role === 'elder')) return DEMO_USERS.elder;
  return { id: 'user-demo', nickname: '暖伴用户', email: 'demo@nuanban.dev' };
}

function loginDemoWx(pickRole?: RoleKey) {
  syncMockRolesFromStorage();
  const roles = mockRegisterRoles.length ? [...mockRegisterRoles] : readStoredRoles();
  if (!roles.length) {
    return {
      token: MOCK_TOKEN,
      user: { id: 'user-demo', nickname: '暖伴用户', email: 'demo@nuanban.dev' },
      roles: [] as DemoAuthRole[],
    };
  }
  const activeRoles = roles.filter((r) => r.status === 'active');
  const active =
    pickRole && activeRoles.some((r) => r.role === pickRole)
      ? pickRole
      : activeRoles.length === 1
        ? activeRoles[0].role
        : undefined;
  return {
    token: MOCK_TOKEN,
    user: demoUserForRoles(roles),
    roles,
    activeRole: active,
  };
}

syncMockRolesFromStorage();

function loginByEmail(email: string, pickRole?: RoleKey) {
  const em = email.toLowerCase();
  const role = pickRole || roleFromEmail(email);
  let user: { id: string; email: string; nickname: string };
  let studentStatus = 'active';

  if (em.includes('multi1')) {
    return {
      token: MOCK_TOKEN,
      user: { id: USERS.multi.id, nickname: USERS.multi.nickname, email },
      roles: [
        { role: 'elder', status: 'active', elderProfileId: 'elder-zhang' },
        { role: 'family', status: 'active', elderProfileId: null },
        { role: 'student', status: 'active', elderProfileId: null },
      ],
    };
  }

  if (em.includes('student3')) {
    user = { ...DEMO_USERS.studentPending, email };
    studentProfileState.displayName = '待审同学';
    studentProfileState.schoolName = '示范大学';
    studentStatus = 'pending';
  } else if (em.includes('student2')) {
    user = { id: USERS.student.id, email, nickname: '周同学' };
    studentProfileState.displayName = '周同学';
    studentProfileState.schoolName = '城东师范学院';
  } else {
    user =
      role === 'student'
        ? { ...USERS.student, email }
        : role === 'family'
          ? { ...USERS.family, email }
          : { ...USERS.elder, email };
    if (role === 'student') {
      studentProfileState.displayName = '林同学';
      studentProfileState.schoolName = '示范大学';
    }
  }

  const roles: { role: RoleKey; status: string; elderProfileId?: string | null }[] = [
    {
      role,
      status: role === 'student' ? studentStatus : 'active',
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

/** 演示模式：宽松校验 X-Active-Role（仅关键端点），返回错误文案或 null */
function assertDemoActiveRole(
  options: UniApp.RequestOptions,
  path: string,
  expectedRole: RoleKey,
): string | null {
  const hdr = (options.header || {}) as Record<string, string>;
  const active = hdr['X-Active-Role'];
  if (!active) return null;
  const strictPaths = [
    '/nuanban/student/orders/pending',
    '/nuanban/family/stats',
    '/nuanban/elder/stats',
  ];
  if (strictPaths.some((p) => path === p || path.startsWith(p)) && active !== expectedRole) {
    return '身份不匹配';
  }
  return null;
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
    expand: { org: { id: e.org, name: orgNameById(e.org) } },
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
    orgName: elder ? orgNameById(elder.org) : ORG.name,
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

  if (method === 'POST' && path === '/nuanban/auth/register') {
    const role = (data.role as RoleKey) || 'student';
    const displayName = data.displayName ? String(data.displayName) : undefined;
    const status = 'active';
    const existing = mockRegisterRoles.find((r) => r.role === role);
    if (!existing) {
      mockRegisterRoles.push({
        role,
        status,
        elderProfileId: role === 'elder' ? 'elder-zhang' : null,
      });
    }
    if (role === 'student' && displayName) {
      studentProfileState.displayName = displayName;
      studentProfileState.schoolName = '示范大学';
    }
    const roles = [...mockRegisterRoles];
    const user = demoUserForRoles(roles);
    if (displayName) user.nickname = displayName;
    persistDemoRoles(roles, user);
    return delay({ ok: true, roles } as T);
  }

  if (method === 'POST' && path === '/nuanban/dev-login') {
    const email = String(data.email || 'student1@test.nuanban.dev');
    return delay(loginByEmail(email) as T);
  }

  if (method === 'POST' && path === '/nuanban/phone-login') {
    const phone = String(data.phone || '').replace(/\D/g, '');
    if (phone.length !== 11) {
      return Promise.reject({ message: '请输入 11 位手机号', statusCode: 400 });
    }
    const code = data.code != null ? String(data.code) : '';
    if (code && code.length < 4) {
      return Promise.reject({ message: '验证码无效', statusCode: 400 });
    }
    return delay(loginByEmail(emailFromPhone(phone)) as T);
  }

  if (method === 'POST' && path === '/nuanban/wx-login') {
    const pickRole = data.role as RoleKey | undefined;
    return delay(loginDemoWx(pickRole) as T);
  }

  if (method === 'GET' && path === '/nuanban/student/settlements') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay({ list: [...state.settlements].reverse() } as T);
  }
  if (method === 'POST' && path === '/nuanban/family/packages/purchase') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const pkgId = String(data.packageId || SERVICE_PACKAGES[0].id);
    const pkg = SERVICE_PACKAGES.find((p) => p.id === pkgId) || SERVICE_PACKAGES[0];
    const id = `order-pkg-${Date.now()}`;
    state.orders.push({
      id,
      elder: 'elder-1',
      service_item: 'svc-chat',
      status: 'pending_payment',
      amount_cents: pkg.priceYuan * 100,
      payment_status: 'unpaid',
      family_user: USERS.family.id,
      scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    });
    return delay({ ok: true, orderId: id, status: 'pending_payment', packageName: pkg.name } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/profile') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay({
      nickname: USERS.student.nickname,
      email: USERS.student.email,
      schoolName: studentProfileState.schoolName,
      displayName: studentProfileState.displayName,
    } as T);
  }
  if (method === 'PATCH' && path === '/nuanban/student/profile') {
    if (data.displayName) studentProfileState.displayName = String(data.displayName);
    if (data.schoolName) studentProfileState.schoolName = String(data.schoolName);
    return delay({ ok: true, ...studentProfileState } as T);
  }
  if (method === 'GET' && path === '/nuanban/org/orders/dispatchable') {
    const list = state.orders
      .filter((o) => o.status === 'pending_accept' && !o.student_user)
      .map(pendingOrderDto);
    return delay({ list } as T);
  }
  const orgDispatch = path.match(/^\/nuanban\/org\/orders\/([^/]+)\/dispatch$/);
  if (method === 'POST' && orgDispatch) {
    const order = state.orders.find((o) => o.id === orgDispatch[1]);
    if (order && order.status === 'pending_accept') {
      order.student_user = String(data.studentUserId || USERS.student.id);
      order.status = 'pending_service';
    }
    return delay({ ok: true, status: order?.status || 'pending_service' } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/stats') {
    const sid = USERS.student.id;
    const mine = state.orders.filter((o) => o.student_user === sid);
    const completed = mine.filter((o) => o.status === 'completed');
    const pending = state.orders.filter((o) => o.status === 'pending_accept').length;
    const accepted = mine.filter((o) =>
      ['pending_service', 'in_service', 'completed'].includes(o.status),
    ).length;
    const income = completed.reduce((s, o) => s + o.amount_cents, 0);
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthCount = completed.filter((o) => o.scheduled_at.startsWith(monthPrefix)).length;
    return delay({
      acceptedCount: accepted + pending,
      monthCount,
      pendingCount: pending,
      incomeCents: income,
      incomeYuan: (income / 100).toFixed(2),
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/service-logs') {
    return delay({ list: state.serviceLogs } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/orders/pending') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
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
  const studentOrderCheckin = path.match(/^\/nuanban\/student\/orders\/([^/]+)\/checkin$/);
  if (method === 'POST' && studentOrderCheckin) {
    const order = state.orders.find((o) => o.id === studentOrderCheckin[1]);
    if (!order || order.status !== 'pending_service') {
      return Promise.reject({ message: '当前状态不可签到' });
    }
    order.status = 'in_service';
    return delay({ ok: true, status: 'in_service' } as T);
  }
  const studentOrderComplete = path.match(/^\/nuanban\/student\/orders\/([^/]+)\/complete$/);
  if (method === 'POST' && studentOrderComplete) {
    const order = state.orders.find((o) => o.id === studentOrderComplete[1]);
    if (order && order.status === 'in_service') {
      order.status = 'completed';
      order.student_user = USERS.student.id;
      const elder = elderById(order.elder);
      const svc = serviceById(order.service_item);
      state.serviceLogs.unshift({
        id: `log-${order.id}-${Date.now()}`,
        orderId: order.id,
        elderId: order.elder,
        elderName: elder?.name || '老人',
        serviceName: svc.name,
        summary: `完成${svc.name}，服务记录已归档（演示）`,
        createdAt: new Date().toISOString(),
      });
      addToPendingSettlement(order.amount_cents);
    }
    return delay({
      ok: true,
      status: order?.status || 'completed',
      settlementPending: true,
      settlementPeriod: currentSettlementPeriod(),
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/schedules') {
    const active = state.orders.filter(
      (o) =>
        o.student_user === USERS.student.id &&
        ['pending_service', 'in_service', 'completed'].includes(o.status),
    );
    const list = active.map((o) => {
      const elder = elderById(o.elder);
      const svc = serviceById(o.service_item);
      return {
        id: `sch-${o.id}`,
        orderId: o.id,
        elderName: elder?.name || '老人',
        serviceName: svc.name,
        status: o.status === 'completed' ? 'completed' : o.status,
        scheduledStart: o.scheduled_at,
      };
    });
    return delay({ list } as T);
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
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const pendingPay = state.orders.filter((o) => o.status === 'pending_payment').length;
    const outdoorPending = state.outdoorApprovals.filter((a) => a.status === 'pending_family').length;
    const sosPending = state.sosAlerts.filter((a) => a.status === 'active').length;
    return delay({
      boundElderCount: ELDERS.length,
      pendingPaymentCount: pendingPay,
      outdoorPendingCount: outdoorPending,
      sosPendingCount: sosPending,
      paidTotalCents: state.orders
        .filter((o) => o.payment_status === 'paid')
        .reduce((s, o) => s + o.amount_cents, 0),
      paidTotalYuan: (
        state.orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + o.amount_cents, 0) /
        100
      ).toFixed(2),
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
  const familyOrderGet = path.match(/^\/nuanban\/family\/orders\/([^/]+)$/);
  if (method === 'GET' && familyOrderGet) {
    const order = state.orders.find((o) => o.id === familyOrderGet[1]);
    if (!order) return Promise.reject({ message: '订单不存在' });
    const dto = pendingOrderDto(order);
    return delay({
      id: order.id,
      status: order.status,
      amount_cents: order.amount_cents,
      scheduled_at: order.scheduled_at,
      payment_status: order.payment_status,
      elderName: dto.elderName,
      serviceName: dto.serviceName,
      requiresOutdoorApproval: dto.requiresOutdoorApproval,
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
    const roleErr = assertDemoActiveRole(options, path, 'elder');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const elderId = normalizeElderId('elder-zhang', ELDERS);
    const elderOrders = state.orders.filter((o) => o.elder === elderId);
    const elder = elderById(elderId);
    return delay({
      elderProfileId: 'elder-zhang',
      elderName: elder?.name || '张奶奶',
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

  if (method === 'POST' && path === '/nuanban/platform/god-view-auth') {
    const pwd = String(data.password || '');
    const expected = import.meta.env.VITE_GOD_VIEW_PASSWORD || 'nuanban2025';
    if (pwd !== expected) {
      return Promise.reject({ message: '密码错误', statusCode: 403 });
    }
    return delay({ ok: true } as T);
  }

  if (method === 'GET' && path === '/nuanban/platform/overview') {
    if (!isGodViewUnlocked()) {
      return Promise.reject({ message: '需要超级管理员授权', statusCode: 403 });
    }
    const pending = state.orders.filter((o) => o.status === 'pending_accept').length;
    const inSvc = state.orders.filter((o) => o.status === 'in_service').length;
    const done = state.orders.filter((o) => o.status === 'completed').length;
    return delay({
      mission: APP_TAGLINE,
      updatedAt: new Date().toISOString(),
      eldersTotal: ELDERS.length,
      studentsActive: CAREGIVERS.length,
      ordersPendingAccept: pending,
      ordersInService: inSvc,
      ordersCompleted: done,
      caregiversNearby: CAREGIVERS.length,
      eldersNearby: ELDERS.length,
      todayMatches: inSvc + Math.min(done, 12),
      matchSuccessRatePct: 94,
      matchingPaths: [
        {
          id: 'org_dispatch',
          label: '机构派单',
          description: '平台/养老院将订单指定给同学',
          status: 'demo',
          metric: '待派单',
          metricValue: pending,
        },
        {
          id: 'elder_find_student',
          label: '老人找同学',
          description: '老人按距离浏览女大学生志愿者并预约',
          status: 'live',
          metric: '附近同学',
          metricValue: CAREGIVERS.length,
        },
        {
          id: 'student_find_elder',
          label: '同学找需求',
          description: '学生看待接单池或附近老人并接单',
          status: 'live',
          metric: '附近老人',
          metricValue: ELDERS.length,
        },
      ],
      coreCompletionPct: 88,
      auditStatus: 'PASS',
      demoUrl: 'https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login',
    } as T);
  }

  if (method === 'GET' && path === '/nuanban/auth/me') {
    syncMockRolesFromStorage();
    const roles = mockRegisterRoles.length ? [...mockRegisterRoles] : readStoredRoles();
    return delay({ roles } as T);
  }

  return Promise.reject({ message: `[演示模式] 未模拟: ${method} ${path}` });
}

import { APP_TAGLINE } from '../config/brand';
import {
  applyReferralOnFirstOrderComplete,
  applyReferralOnStudentRegister,
  getReferralOverview,
} from './demo-referral';
import {
  getWalletOverview,
  payOrderFromWallet,
  resolveDemoFamilyUserId,
  resolveDemoWalletUserId,
  topupWallet,
} from './demo-wallet';
import {
  buildSeedActivities,
  type ActivityEvent,
  type ActivityKind,
} from './demo-activity';
import {
  loadDemoRuntimeState,
  resetDemoRuntimeState as clearAllDemoStorage,
  saveDemoRuntimeState,
  type DemoRuntimeState,
  type MockOutdoorApproval,
  type MockSosAlert,
} from './demo-mock-state';
import { getStudentWithdrawalOverview, submitStudentWithdrawal } from './demo-student-wallet';
import {
  approveAdminWithdrawal,
  getAdminFundOverview,
  listAdminPayments,
  listAdminTopups,
  listAdminWithdrawals,
  markFundReconciled,
  rejectAdminWithdrawal,
} from './demo-admin-funds';
import type { RoleKey } from '../config/tabs';
import { isGuestBrowse, notifyGuestSimulate } from './guest-browse';
import { getMockAvatarUrl } from './mock-avatar-storage';
import {
  getMockCartoonAvatarId,
  getMockVerificationPhotoUrl,
  setMockCartoonAvatarId,
} from './mock-verification-storage';
import { defaultCartoonAvatarId, resolveCartoonAvatarUrl } from './cartoon-avatars';
import { isKnownSchool } from './known-schools';
import { haversineKm } from './geo';
import {
  buildRichCaregivers,
  buildRichElders,
  buildRichOrders,
  buildServiceLogs,
  DEMO_ORG_MAIN,
  DEMO_PHONE_EMAIL,
  DEMO_USERS,
  getElderSelfProfile,
  getFamilyProfile,
  getRichCaregiverProfile,
  getRichElderProfile,
  getStudentFullProfile,
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

/** 运营台学生审核状态覆盖（Mock） */
const mockStudentStatusOverrides: Record<string, string> = {};

const USERS = DEMO_USERS;
const ORG = DEMO_ORG_MAIN;
const ELDERS = buildRichElders();
/** 家属演示绑定：张奶奶、李爷爷、王阿姨 */
const PRIMARY_FAMILY_ELDER_IDS = ['elder-1', 'elder-2', 'elder-3'];
const PRIMARY_FAMILY_RELATIONS: Record<string, string> = {
  'elder-1': '女儿',
  'elder-2': '儿子',
  'elder-3': '儿媳',
};
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
  | 'pending_confirm'
  | 'accepted'
  | 'completed'
  | 'paid'
  | 'cancelled';

type MockOrder = RichOrder;

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
  const profile = getRichCaregiverProfile(c.userId);
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    school: c.school,
    gender: profile?.gender,
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
  gender: '女',
  bio: '热心公益的在校女生，擅长陪伴聊天与康复协助，希望用课余时间为附近老人送去温暖。',
  major: '护理学',
  grade: '大三',
  availableHours: ['周一至周五 14:00–18:00', '周六 9:00–12:00'],
  serviceAreas: ['浦东新区', '黄浦区'],
};

const familyProfileState = {
  nickname: '',
  contactPhone: '',
  district: '',
  address: '',
  relationToElder: '',
  seeded: true,
};

const elderProfileState = {
  name: '',
  age: 0,
  gender: '女',
  district: '',
  address: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',
  seeded: true,
};

const paymentAccountStore = new Map<
  string,
  { configured: boolean; merchantNo?: string; accountName?: string; accountLabel?: string }
>();

function paymentAccountKey(userId: string, role: RoleKey) {
  return `${userId}_${role}`;
}

function paymentAccountDto(userId: string, role: RoleKey) {
  const st = paymentAccountStore.get(paymentAccountKey(userId, role));
  if (!st?.configured) {
    return { provider: 'saobei' as const, configured: false };
  }
  const tail = (st.merchantNo || '').slice(-4) || '8029';
  return {
    provider: 'saobei' as const,
    configured: true,
    merchantNo: st.merchantNo,
    accountName: st.accountName,
    accountLabel: st.accountLabel || `扫呗 · ****${tail}`,
  };
}

function seedDemoPaymentAccount(userId: string, role: RoleKey) {
  paymentAccountStore.set(paymentAccountKey(userId, role), {
    configured: true,
    merchantNo: '80291234',
    accountName: '演示账户',
    accountLabel: '扫呗 · ****1234',
  });
}

function seedDemoPaymentAccounts(email: string, userId: string) {
  const em = email.toLowerCase();
  if (em.includes('student3')) return;
  const roles: RoleKey[] = [];
  if (em.includes('multi')) roles.push('student', 'family', 'elder');
  else {
    if (em.includes('student')) roles.push('student');
    if (em.includes('family')) roles.push('family');
    if (em.includes('elder')) roles.push('elder');
  }
  for (const role of roles) seedDemoPaymentAccount(userId, role);
}

function studentProfileComplete() {
  return isKnownSchool(studentProfileState.schoolName);
}

function familyProfileComplete() {
  if (!familyProfileState.seeded) {
    return !!(
      familyProfileState.nickname.trim() &&
      familyProfileState.contactPhone.trim() &&
      familyProfileState.district.trim()
    );
  }
  const base = getFamilyProfile();
  return !!(base.nickname.trim() && base.contactPhone.trim() && base.district.trim());
}

function elderProfileComplete() {
  return true;
}

function resetRoleProfileState(role: RoleKey, displayName?: string) {
  if (role === 'student') {
    studentProfileState.displayName = displayName || '';
    studentProfileState.schoolName = '';
    studentProfileState.gender = '女';
    studentProfileState.major = '';
    studentProfileState.bio = '';
    studentProfileState.serviceAreas = [];
    studentProfileState.availableHours = [];
  }
  if (role === 'family') {
    familyProfileState.nickname = displayName || '';
    familyProfileState.contactPhone = '';
    familyProfileState.district = '';
    familyProfileState.address = '';
    familyProfileState.relationToElder = '';
    familyProfileState.seeded = false;
  }
  if (role === 'elder') {
    elderProfileState.name = displayName || '';
    elderProfileState.age = 0;
    elderProfileState.gender = '女';
    elderProfileState.district = '';
    elderProfileState.address = '';
    elderProfileState.emergencyName = '';
    elderProfileState.emergencyRelation = '';
    elderProfileState.emergencyPhone = '';
    elderProfileState.seeded = false;
  }
}

function isNewPhoneDemoEmail(email: string): boolean {
  return /^m\d{11}@test\.nuanban\.dev$/i.test(email);
}

function seedDemoRoleProfiles(email: string) {
  const em = email.toLowerCase();
  if (isNewPhoneDemoEmail(em)) return;
  familyProfileState.seeded = true;
  elderProfileState.seeded = true;
  if (em.includes('student3')) return;
  if (em.includes('student2')) {
    studentProfileState.displayName = '周同学';
    studentProfileState.schoolName = '城东师范学院';
    return;
  }
  if (em.includes('family')) return;
  if (em.includes('elder')) return;
  if (em.includes('multi')) return;
  studentProfileState.displayName = '林同学';
  studentProfileState.schoolName = '示范大学';
}

function studentProfileDto() {
  const dto = getStudentFullProfile(studentProfileState);
  const userId = currentDemoUser().id;
  const cartoonId =
    getMockCartoonAvatarId(userId) || defaultCartoonAvatarId(dto.displayName || dto.nickname);
  const verificationPhotoUrl = getMockVerificationPhotoUrl(userId);
  return {
    ...dto,
    cartoonAvatarId: cartoonId,
    avatarUrl: resolveCartoonAvatarUrl(cartoonId),
    verificationPhotoUrl: verificationPhotoUrl || undefined,
    profileComplete: studentProfileComplete(),
  };
}

function familyProfileDto() {
  const base = familyProfileState.seeded ? getFamilyProfile() : null;
  const dto = {
    nickname: familyProfileState.seeded
      ? base!.nickname
      : familyProfileState.nickname || '家属',
    email: base?.email || DEMO_USERS.family.email,
    relationToElder: familyProfileState.seeded
      ? base!.relationToElder
      : familyProfileState.relationToElder || '家属',
    linkedElderName: base?.linkedElderName || '张奶奶',
    linkedElderId: base?.linkedElderId || 'elder-1',
    contactPhone: familyProfileState.seeded
      ? base!.contactPhone
      : familyProfileState.contactPhone,
    district: familyProfileState.seeded ? base!.district : familyProfileState.district,
    address: familyProfileState.seeded ? base!.address : familyProfileState.address,
    notificationPrefs: base?.notificationPrefs || [
      '订单状态变更',
      '外出审批提醒',
      'SOS 紧急通知',
      '支付成功通知',
    ],
    profileComplete: familyProfileComplete(),
  };
  const url = getMockAvatarUrl(USERS.family.id);
  return url ? { ...dto, avatarUrl: url } : dto;
}

function elderSelfProfileDto() {
  const base = elderProfileState.seeded ? getElderSelfProfile() : null;
  const dto = {
    id: base?.id || 'elder-1',
    name: elderProfileState.seeded ? base!.name : elderProfileState.name || '老人',
    age: elderProfileState.seeded ? base!.age : elderProfileState.age || 78,
    gender: elderProfileState.seeded ? base!.gender : elderProfileState.gender,
    district: elderProfileState.seeded ? base!.district : elderProfileState.district,
    address: elderProfileState.seeded ? base!.address : elderProfileState.address,
    orgName: elderProfileState.seeded ? base!.orgName || '' : '',
    healthStatus: elderProfileState.seeded ? base!.healthStatus || '' : '',
    mobility: elderProfileState.seeded ? base!.mobility || '' : '',
    hobbies: elderProfileState.seeded && base!.hobbies?.length ? base!.hobbies : [],
    servicePreferences:
      elderProfileState.seeded && base!.servicePreferences?.length
        ? base!.servicePreferences
        : [],
    livingSituation: elderProfileState.seeded ? base!.livingSituation || '' : '',
    emergencyContact: {
      name: elderProfileState.seeded
        ? base!.emergencyContact.name
        : elderProfileState.emergencyName,
      relation: elderProfileState.seeded
        ? base!.emergencyContact.relation
        : elderProfileState.emergencyRelation,
      phone: elderProfileState.seeded
        ? base!.emergencyContact.phone
        : elderProfileState.emergencyPhone,
    },
    preferredVisitTimes:
      elderProfileState.seeded && base!.preferredVisitTimes?.length
        ? base!.preferredVisitTimes
        : [],
    notes: elderProfileState.seeded ? base!.notes || '' : '',
    profileComplete: elderProfileComplete(),
  };
  const url = getMockAvatarUrl(USERS.elder.id);
  return url ? { ...dto, avatarUrl: url } : dto;
}

function elderProfileDto(id: string) {
  const p = getRichElderProfile(id);
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    district: p.district,
    address: p.address,
    orgName: orgNameById(p.org),
    tags: p.tags,
    intro: p.intro,
    healthStatus: p.healthStatus,
    mobility: p.mobility,
    hobbies: p.hobbies,
    servicePreferences: p.servicePreferences,
    livingSituation: p.livingSituation,
    emergencyContact: p.emergencyContact,
    preferredVisitTimes: p.preferredVisitTimes,
    notes: p.notes,
  };
}

function caregiverProfileDto(idOrUserId: string, distanceKm?: number) {
  const p = getRichCaregiverProfile(idOrUserId);
  if (!p) return null;
  const km = distanceKm ?? p.distanceKm;
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    school: p.school,
    distanceKm: km,
    distance: formatKm(km),
    rating: p.rating,
    orderCount: p.orderCount,
    intro: p.intro,
    tags: p.tags,
    gender: p.gender,
    major: p.major,
    grade: p.grade,
    age: p.age,
    phone: p.phone,
    bio: p.bio,
    serviceAreas: p.serviceAreas,
    availableHours: p.availableHours,
    certifications: p.certifications,
    languages: p.languages,
    personalityTags: p.personalityTags,
    serviceTypes: p.serviceTypes,
    completedOrderThemes: p.completedOrderThemes,
    reviewSummary: p.reviewSummary,
  };
}

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

function walletPayLabel(order: MockOrder) {
  const svc = serviceById(order.service_item);
  const elder = elderById(order.elder);
  return `${svc.name} · ${elder?.name || '老人'}`;
}

function walletPayOrderForUser(
  userId: string,
  orderId: string,
  scope: 'family' | 'elder' = 'family',
) {
  const walletUserId = resolveDemoWalletUserId(userId, scope);
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false as const, message: '订单不存在' };
  if (order.payment_status === 'paid') return { ok: false as const, message: '订单已支付' };
  const payable =
    order.status === 'pending_payment' ||
    (order.status === 'pending_confirm' && order.payment_status === 'unpaid');
  if (!payable) return { ok: false as const, message: '当前订单状态不可支付' };
  const result = payOrderFromWallet(
    walletUserId,
    orderId,
    order.amount_cents,
    walletPayLabel(order),
  );
  if (!result.ok) return result;
  order.payment_status = 'paid';
  if (order.status === 'pending_payment') {
    mockAppendTimeline(order.id, 'pending_payment', '储值卡支付完成', scope === 'elder' ? 'elder' : 'family');
    order.status = 'pending_accept';
    mockAppendTimeline(order.id, 'pending_accept', '等待同学接单', 'system');
  } else {
    mockAppendTimeline(order.id, 'pending_payment', '储值卡支付完成', scope === 'elder' ? 'elder' : 'family');
  }
  const elder = elderById(order.elder);
  const svc = serviceById(order.service_item);
  recordActivity(
    'order_paid',
    '储值卡支付成功',
    `${elder?.name || '老人'} · ${svc.name} ¥${(order.amount_cents / 100).toFixed(0)}`,
    { role: 'family', orderId: order.id },
  );
  persistDemoState();
  return { ok: true as const, status: order.status, overview: result.overview };
}

function finalizeOrderAfterConfirm(order: MockOrder) {
  if (order.payment_status === 'unpaid') {
    order.payment_status = 'paid';
    mockAppendTimeline(order.id, 'pending_payment', '确认时完成支付', 'family');
  }
  mockAppendTimeline(order.id, 'completed', '已确认完成，收入将计入结算', 'family');
  order.status = 'completed';
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
  if (order.student_user) {
    applyReferralOnFirstOrderComplete(order.student_user);
  }
  recordActivity(
    'order_confirmed',
    '服务已确认完成',
    `${elder?.name || '老人'} · ${svc.name} · 已归档`,
    { role: 'family', orderId: order.id },
  );
  persistDemoState();
}

function buildSeedRuntimeState(): DemoRuntimeState {
  const orders = buildRichOrders(ELDERS) as MockOrder[];
  const serviceLogs = buildServiceLogs(orders, (eid) => elderById(eid)?.name || '老人').map(
    (log) => ({
      ...log,
      serviceName: serviceById(log.serviceName).name,
    }),
  );
  const outdoorApprovals: MockOutdoorApproval[] = orders
    .filter((o) => o.status === 'outdoor_pending')
    .map((o, i) => ({
      id: `outdoor-approval-${i + 1}`,
      order: o.id,
      status: 'pending_family',
      family_user: USERS.family.id,
    }));
  return {
    orders,
    settlements: [...SETTLEMENTS] as SettlementRecord[],
    serviceLogs,
    sosAlerts: [
      {
        id: 'sos-seed-1',
        elder: 'elder-1',
        message: '演示：老人昨日求助已恢复（可新建 SOS 测试）',
        status: 'active',
        created_at: new Date(Date.now() - 600000).toISOString(),
      },
    ],
    outdoorApprovals,
    activityEvents: buildSeedActivities(),
  };
}

const state = loadDemoRuntimeState(buildSeedRuntimeState());
if (!state.activityEvents?.length) {
  state.activityEvents = buildSeedActivities();
}

function recordActivity(
  kind: ActivityKind,
  title: string,
  detail: string,
  extra?: Pick<ActivityEvent, 'role' | 'orderId'>,
) {
  state.activityEvents.unshift({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    kind,
    title,
    detail,
    role: extra?.role,
    orderId: extra?.orderId,
    createdAt: new Date().toISOString(),
  });
  if (state.activityEvents.length > 50) {
    state.activityEvents = state.activityEvents.slice(0, 50);
  }
}

function persistDemoState() {
  if (isGuestBrowse()) {
    notifyGuestSimulate();
    return;
  }
  saveDemoRuntimeState(state);
}

function resetRuntimeStateInMemory() {
  const seed = buildSeedRuntimeState();
  state.orders = seed.orders;
  state.settlements = seed.settlements;
  state.serviceLogs = seed.serviceLogs;
  state.sosAlerts = seed.sosAlerts;
  state.outdoorApprovals = seed.outdoorApprovals;
  state.activityEvents = seed.activityEvents;
}

function seedOutdoorWalkScenario() {
  const id = `order-scenario-${Date.now()}`;
  const svc = serviceById('svc-walk');
  const elder = elderById('elder-1');
  state.orders.unshift({
    id,
    elder: elder?.id || 'elder-1',
    service_item: svc.id,
    status: 'outdoor_pending',
    amount_cents: svc.price_cents,
    payment_status: 'paid',
    family_user: USERS.family.id,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
  });
  state.outdoorApprovals.unshift({
    id: `outdoor-scenario-${Date.now()}`,
    order: id,
    status: 'pending_family',
    family_user: USERS.family.id,
  });
  recordActivity(
    'scenario_seeded',
    '注入外出演示单',
    `${elder?.name || '张奶奶'} · ${svc.name} · 待家属审批`,
    { role: 'platform', orderId: id },
  );
  persistDemoState();
  return { orderId: id, elderName: elder?.name || '张奶奶', serviceName: svc.name };
}

function familyUserFromFilter(filter: string): string | null {
  const raw = filter.match(/family_user = "([^"]+)"/)?.[1];
  return raw ? resolveDemoFamilyUserId(raw) : null;
}

function buildFamilyElderBindings(familyUserId: string) {
  return PRIMARY_FAMILY_ELDER_IDS.map((eid) => {
    const elder = elderById(eid);
    return {
      id: `bind-${eid}`,
      collectionId: 'family_elder_bindings',
      created: '',
      updated: '',
      elder: eid,
      family_user: familyUserId,
      relation_label: PRIMARY_FAMILY_RELATIONS[eid] || '家属',
      expand: { elder: { id: eid, name: elder?.name || '老人' } },
    };
  });
}

function filterMockOrders(items: ReturnType<typeof orderRecord>[], filter: string) {
  let out = items;
  if (filter.includes('pending_payment')) {
    out = out.filter((o) => o.status === 'pending_payment');
  }
  if (filter.includes('pending_confirm')) {
    out = out.filter((o) => o.status === 'pending_confirm');
  }
  if (filter.includes('pending_family')) {
    out = out.filter((o) => o.status === 'outdoor_pending');
  }
  if (filter.includes('family_user =')) {
    const uid = familyUserFromFilter(filter);
    if (uid) out = out.filter((o) => o.family_user === uid);
  }
  if (filter.includes('elder =')) {
    const elderIds = [...filter.matchAll(/elder = "([^"]+)"/g)].map((m) =>
      normalizeElderId(m[1], ELDERS),
    );
    if (elderIds.length) out = out.filter((o) => elderIds.includes(o.elder));
  }
  if (filter.includes('id =')) {
    const id = filter.match(/id = "([^"]+)"/)?.[1];
    if (id) out = out.filter((o) => o.id === id);
  }
  return out;
}

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), 120));
}

function roleFromEmail(email: string): RoleKey {
  const e = email.toLowerCase();
  if (e.includes('elder')) return 'elder';
  if (e.includes('family')) return 'family';
  return 'student';
}

const DEMO_LOGIN_PHONE_KEY = 'demo_login_phone';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isPresetDemoPhone(phone: string): boolean {
  return normalizePhone(phone) in DEMO_PHONE_EMAIL;
}

function emailFromPresetPhone(phone: string): string {
  const digits = normalizePhone(phone);
  return DEMO_PHONE_EMAIL[digits] || 'student1@test.nuanban.dev';
}

function emailFromNewPhone(phone: string): string {
  return `m${normalizePhone(phone)}@test.nuanban.dev`;
}

type PhoneSession = {
  user: { id: string; nickname: string; email: string };
  roles: DemoAuthRole[];
};

function readPhoneSession(phone: string): PhoneSession | null {
  try {
    const raw = uni.getStorageSync(`demo_phone_session_${normalizePhone(phone)}`);
    if (raw && typeof raw === 'object' && Array.isArray((raw as PhoneSession).roles)) {
      return raw as PhoneSession;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function savePhoneSession(phone: string, user: PhoneSession['user'], roles: DemoAuthRole[]) {
  try {
    uni.setStorageSync(`demo_phone_session_${normalizePhone(phone)}`, { user, roles });
    uni.setStorageSync(DEMO_LOGIN_PHONE_KEY, normalizePhone(phone));
  } catch {
    /* ignore */
  }
}

function activeRoleFromRoles(roles: DemoAuthRole[]): RoleKey | undefined {
  const active = roles.filter((r) => r.status === 'active');
  if (active.length === 1) return active[0].role;
  return undefined;
}

/** 新手机号：首次登录无角色 → 注册页；注册后资料未完善 → 编辑资料 */
function loginByNewPhone(phone: string) {
  const digits = normalizePhone(phone);
  const email = emailFromNewPhone(digits);
  const session = readPhoneSession(digits);

  if (session?.roles?.length) {
    mockRegisterRoles.length = 0;
    mockRegisterRoles.push(...session.roles);
    persistDemoRoles(session.roles, session.user);
    return {
      token: MOCK_TOKEN,
      user: session.user,
      roles: session.roles,
      activeRole: activeRoleFromRoles(session.roles),
    };
  }

  mockRegisterRoles.length = 0;
  try {
    uni.removeStorageSync(DEMO_STORAGE_ROLES);
  } catch {
    /* ignore */
  }
  const user = { id: `user-phone-${digits}`, nickname: '', email };
  try {
    uni.setStorageSync(DEMO_STORAGE_USER, user);
    uni.setStorageSync(DEMO_LOGIN_PHONE_KEY, digits);
  } catch {
    /* ignore */
  }
  return {
    token: MOCK_TOKEN,
    user,
    roles: [] as DemoAuthRole[],
  };
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
  const active = roles.filter((r) => r.status === 'active');
  if (
    active.some((r) => r.role === 'student') &&
    active.some((r) => r.role === 'family') &&
    active.some((r) => r.role === 'elder')
  ) {
    return { ...DEMO_USERS.multi };
  }
  if (active.some((r) => r.role === 'student')) {
    return {
      ...DEMO_USERS.student,
      nickname: studentProfileState.displayName || DEMO_USERS.student.nickname,
    };
  }
  if (active.some((r) => r.role === 'family')) return DEMO_USERS.family;
  if (active.some((r) => r.role === 'elder')) return DEMO_USERS.elder;
  return { id: 'user-demo', nickname: '暖伴用户', email: 'demo@nuanban.dev' };
}

function currentDemoUser() {
  syncMockRolesFromStorage();
  const roles = mockRegisterRoles.length ? [...mockRegisterRoles] : readStoredRoles();
  return demoUserForRoles(roles);
}

function currentStudentUserId() {
  return currentDemoUser().id;
}

const mockWechatByUser: Record<string, string> = {};

function currentActiveRole(): RoleKey | undefined {
  syncMockRolesFromStorage();
  const roles = mockRegisterRoles.length ? [...mockRegisterRoles] : readStoredRoles();
  return roles.find((r) => r.status === 'active')?.role;
}

function currentChatSender() {
  const user = currentDemoUser();
  const role = currentActiveRole();
  if (role === 'family') {
    return { userId: user.id, role: 'family' as const, alias: '家属·我' };
  }
  if (role === 'elder') {
    return { userId: user.id, role: 'elder' as const, alias: '老人·我' };
  }
  return { userId: user.id, role: 'student' as const, alias: '陪护同学·我' };
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
  seedDemoRoleProfiles(email);

  if (em.includes('multi1')) {
    seedDemoPaymentAccounts(email, USERS.multi.id);
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
  seedDemoPaymentAccounts(email, user.id);
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
    student_user: o.student_user,
    expand: {
      elder: elder ? { id: elder.id, name: elder.name } : undefined,
      service_item: {
        id: svc.id,
        name: svc.name,
        price_cents: svc.price_cents,
        duration_minutes: svc.duration_minutes,
        requires_outdoor_approval: svc.requires_outdoor_approval,
      },
      student: o.student_user
        ? { id: o.student_user, name: caregiverNameByUserId(o.student_user) }
        : undefined,
    },
  };
}

const mockOrderTimelines: Record<
  string,
  Array<{ key: string; at: string; detail: string; actor?: string }>
> = {};
const DEMO_SMS_MASTER = '000000';
const mockSmsOtp: Record<string, string> = {};
const mockCaptchaChallenges: Record<
  string,
  { correctIds: string; used: boolean }
> = {};
const mockCaptchaTokens = new Set<string>();
const mockSmsOutbox: Array<{ phone: string; code: string; sentAt: string; channel: string }> = [];

const mockOrderMessages: Record<
  string,
  Array<{
    id: string;
    orderId: string;
    senderUser: string;
    senderRole: string;
    senderAlias: string;
    type?: 'text' | 'voice';
    body: string;
    audioBase64?: string;
    mimeType?: string;
    durationSec?: number;
    createdAt: string;
  }>
> = {};

function mockChatOpen(status: string) {
  return ['pending_accept', 'pending_service', 'in_service', 'pending_confirm'].includes(status);
}

function mockOrderMessageDto(
  m: (typeof mockOrderMessages)[string][number],
  viewerId: string,
) {
  const dto: Record<string, unknown> = {
    id: m.id,
    orderId: m.orderId,
    senderRole: m.senderRole,
    senderAlias: m.senderAlias,
    type: m.type || 'text',
    body: m.body,
    createdAt: m.createdAt,
    mine: m.senderUser === viewerId,
  };
  if (m.type === 'voice') {
    dto.durationSec = m.durationSec || 1;
    if (m.audioBase64) {
      dto.audioUrl = `data:${m.mimeType || 'audio/mpeg'};base64,${m.audioBase64}`;
    }
    dto.body = `[语音 ${dto.durationSec}秒]`;
  }
  return dto;
}

function mockAppendTimeline(orderId: string, key: string, detail: string, actor = 'system') {
  if (!mockOrderTimelines[orderId]) mockOrderTimelines[orderId] = [];
  mockOrderTimelines[orderId].push({
    key,
    at: new Date().toISOString(),
    detail,
    actor,
  });
}

function mockTimelineFor(order: MockOrder) {
  if (mockOrderTimelines[order.id]?.length) return mockOrderTimelines[order.id];
  return [{ key: 'created', at: order.scheduled_at, detail: '订单已创建', actor: 'system' }];
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
    timeline: mockTimelineFor(o),
    chatOpen: mockChatOpen(o.status),
  };
}

function caregiverNameByUserId(userId?: string) {
  if (!userId) return undefined;
  return CAREGIVERS.find((c) => c.userId === userId)?.name || '陪护同学';
}

function currentElderId(): string {
  syncMockRolesFromStorage();
  const storedRoles = mockRegisterRoles.length ? [...mockRegisterRoles] : readStoredRoles();
  const elderRole = storedRoles.find((r) => r.role === 'elder' && r.status === 'active');
  return normalizeElderId(elderRole?.elderProfileId || 'elder-zhang', ELDERS);
}

function familyServiceLogs() {
  return state.serviceLogs.filter((log) => PRIMARY_FAMILY_ELDER_IDS.includes(log.elderId));
}

function elderServiceLogs() {
  const eid = currentElderId();
  return state.serviceLogs.filter((log) => log.elderId === eid);
}

function studentServiceLogs() {
  const sid = currentStudentUserId();
  const orderIds = new Set(
    state.orders.filter((o) => o.student_user === sid).map((o) => o.id),
  );
  return state.serviceLogs.filter((log) => orderIds.has(log.orderId));
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

/** 运营演示：重置 localStorage 并刷新页面 */
export function resetDemoRuntimeState() {
  clearAllDemoStorage();
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * 演示 Mock：游客、显式 VITE_DEMO_MOCK、GitHub Pages 测试备份。
 * 阿里云 / 本地 parity 模式（VITE_DEMO_MOCK=false）走真实 PocketBase API。
 */
export function isDemoMockEnabled(): boolean {
  if (isGuestBrowse()) return true;
  if (import.meta.env.VITE_DEMO_MOCK === 'true') return true;
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
    return true;
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
    resetRoleProfileState(role, displayName);
    if (role === 'student' && data.gender) {
      studentProfileState.gender = String(data.gender);
    }
    if (role === 'elder' && data.gender) {
      elderProfileState.gender = String(data.gender);
    }
    const roles = [...mockRegisterRoles];
    let user: { id: string; nickname: string; email: string };
    try {
      const stored = uni.getStorageSync(DEMO_STORAGE_USER) as PhoneSession['user'];
      user = stored?.id
        ? { ...stored, nickname: displayName || stored.nickname || '' }
        : demoUserForRoles(roles);
    } catch {
      user = demoUserForRoles(roles);
    }
    if (displayName) user.nickname = displayName;
    if (data.wechatId) mockWechatByUser[user.id] = String(data.wechatId);
    persistDemoRoles(roles, user);
    try {
      const phone = uni.getStorageSync(DEMO_LOGIN_PHONE_KEY) as string;
      if (phone) savePhoneSession(phone, user, roles);
    } catch {
      /* ignore */
    }
    if (role === 'student' && data.referralCode) {
      applyReferralOnStudentRegister(user.id, displayName || user.nickname, String(data.referralCode));
    }
    return delay({ ok: true, roles } as T);
  }

  if (method === 'POST' && path === '/nuanban/dev-login') {
    const email = String(data.email || 'student1@test.nuanban.dev');
    return delay(loginByEmail(email) as T);
  }

  if (method === 'GET' && path === '/nuanban/captcha/challenge') {
    const topics = [
      { label: '动物', pool: ['🐱', '🐶', '🐰', '🐻', '🦁', '🐼'] },
      { label: '水果', pool: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍑'] },
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const correct = topic.pool.slice(0, 3);
    const wrong = topics.find((t) => t.label !== topic.label)!.pool.slice(0, 6);
    const tiles = [...correct, ...wrong]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: `t${i}`, emoji }));
    const correctIds = tiles
      .filter((t) => correct.includes(t.emoji))
      .map((t) => t.id)
      .sort()
      .join(',');
    const challengeId = `cap_mock_${Date.now()}`;
    mockCaptchaChallenges[challengeId] = { correctIds, used: false };
    return delay({
      challengeId,
      prompt: `请点选所有【${topic.label}】图案`,
      tiles,
      expiresIn: 300,
    } as T);
  }

  if (method === 'POST' && path === '/nuanban/captcha/verify') {
    const challengeId = String((data as { challengeId?: string }).challengeId || '');
    const selected = ((data as { selectedIds?: string[] }).selectedIds || []).slice().sort().join(',');
    const ch = mockCaptchaChallenges[challengeId];
    if (!ch || ch.used) {
      return Promise.reject({ message: '安全验证已过期，请刷新', statusCode: 400 });
    }
    if (selected !== ch.correctIds) {
      return Promise.reject({ message: '点选不正确，请重试', statusCode: 400 });
    }
    ch.used = true;
    const token = `cpt_mock_${Date.now()}`;
    mockCaptchaTokens.add(token);
    return delay({ ok: true, captchaToken: token, expiresIn: 300 } as T);
  }

  if (method === 'POST' && path === '/nuanban/sms/send') {
    const phone = normalizePhone(String((data as { phone?: string }).phone || ''));
    const captchaToken = String((data as { captchaToken?: string }).captchaToken || '');
    if (!mockCaptchaTokens.has(captchaToken)) {
      return Promise.reject({ message: '请先完成安全验证', statusCode: 400 });
    }
    mockCaptchaTokens.delete(captchaToken);
    const code = String(100000 + Math.floor(Math.random() * 900000)).slice(-6);
    mockSmsOtp[phone] = code;
    mockSmsOutbox.unshift({
      phone,
      code,
      sentAt: new Date().toISOString(),
      channel: 'self-hosted-mock',
    });
    return delay({
      ok: true,
      message: '验证码已通过平台自建通道发出',
      expiresIn: 300,
      devCode: code,
      devHint: 'Mock 环境已返回验证码',
    } as T);
  }

  if (method === 'GET' && path === '/nuanban/platform/sms-outbox') {
    const key = String((options as { query?: Record<string, string> })?.query?.key || '');
    if (key !== 'nuanban2026') {
      return Promise.reject({ message: '无权查看', statusCode: 403 });
    }
    return delay({ list: mockSmsOutbox.slice(0, 30) } as T);
  }

  if (method === 'POST' && path === '/nuanban/phone-login') {
    const phone = normalizePhone(String(data.phone || ''));
    if (phone.length !== 11) {
      return Promise.reject({ message: '请输入 11 位手机号', statusCode: 400 });
    }
    const code = String(data.code != null ? data.code : '').trim();
    if (code.length !== 6) {
      return Promise.reject({ message: '请输入 6 位短信验证码', statusCode: 400 });
    }
    const otpOk =
      (isPresetDemoPhone(phone) && code === DEMO_SMS_MASTER) || mockSmsOtp[phone] === code;
    if (!otpOk) {
      return Promise.reject({ message: '验证码错误或已过期，请重新获取', statusCode: 400 });
    }
    delete mockSmsOtp[phone];
    if (isPresetDemoPhone(phone)) {
      try {
        uni.setStorageSync(DEMO_LOGIN_PHONE_KEY, phone);
      } catch {
        /* ignore */
      }
      return delay(loginByEmail(emailFromPresetPhone(phone)) as T);
    }
    return delay(loginByNewPhone(phone) as T);
  }

  if (method === 'POST' && path === '/nuanban/wx-login') {
    const pickRole = data.role as RoleKey | undefined;
    return delay(loginDemoWx(pickRole) as T);
  }

  if (method === 'GET' && path === '/nuanban/student/referral') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    return delay(getReferralOverview(user.id) as T);
  }

  if (method === 'GET' && path === '/nuanban/student/settlements') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay({ list: [...state.settlements].reverse() } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/withdrawal') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    return delay(getStudentWithdrawalOverview(user.id, state.settlements) as T);
  }
  if (method === 'POST' && path === '/nuanban/student/withdrawal') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    const pay = paymentAccountDto(user.id, 'student');
    if (!pay.configured) {
      return Promise.reject({ message: '请先绑定收款账户', statusCode: 400 });
    }
    const channel = data.channel === 'bank' ? 'bank' : 'wechat';
    try {
      const overview = submitStudentWithdrawal(
        user.id,
        state.settlements,
        Number(data.amountCents),
        channel,
      );
      return delay(overview as T);
    } catch (err) {
      return Promise.reject({ message: err instanceof Error ? err.message : '提现失败' });
    }
  }
  if (method === 'GET' && path === '/nuanban/family/packages') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay({ list: SERVICE_PACKAGES } as T);
  }
  if (method === 'POST' && path === '/nuanban/family/packages/purchase') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = currentDemoUser();
    const familyUserId = resolveDemoFamilyUserId(user.id);
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
      family_user: familyUserId,
      scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    });
    recordActivity('package_purchased', '购买服务包', `${pkg.name} · 待支付`, {
      role: 'family',
      orderId: id,
    });
    persistDemoState();
    return delay({ ok: true, orderId: id, status: 'pending_payment', packageName: pkg.name } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/profile') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay(studentProfileDto() as T);
  }
  if (method === 'PATCH' && path === '/nuanban/student/profile') {
    if (data.displayName) studentProfileState.displayName = String(data.displayName);
    if (data.schoolName) {
      const name = String(data.schoolName).trim();
      if (!isKnownSchool(name)) {
        return Promise.reject({ message: '请从列表中选择有效学校', statusCode: 400 });
      }
      studentProfileState.schoolName = name;
    }
    if (data.bio != null) studentProfileState.bio = String(data.bio);
    if (data.gender) studentProfileState.gender = String(data.gender);
    if (data.major) studentProfileState.major = String(data.major);
    if (data.grade) studentProfileState.grade = String(data.grade);
    if (data.cartoonAvatarId) {
      setMockCartoonAvatarId(USERS.student.id, String(data.cartoonAvatarId));
    }
    if (Array.isArray(data.availableHours)) {
      studentProfileState.availableHours = data.availableHours.map(String);
    }
    if (Array.isArray(data.serviceAreas)) {
      studentProfileState.serviceAreas = data.serviceAreas.map(String);
    }
    return delay({ ok: true, ...studentProfileDto(), profileComplete: studentProfileComplete() } as T);
  }
  if (method === 'POST' && path === '/nuanban/student/verification-photo') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay({
      ok: true,
      verificationPhotoUrl: getMockVerificationPhotoUrl(USERS.student.id) || '',
    } as T);
  }
  if (method === 'PATCH' && path === '/nuanban/family/profile') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    if (data.nickname) familyProfileState.nickname = String(data.nickname);
    if (data.contactPhone) familyProfileState.contactPhone = String(data.contactPhone);
    if (data.district) familyProfileState.district = String(data.district);
    if (data.address != null) familyProfileState.address = String(data.address);
    if (data.relationToElder) familyProfileState.relationToElder = String(data.relationToElder);
    familyProfileState.seeded = false;
    return delay({ ok: true, ...familyProfileDto() } as T);
  }
  if (method === 'PATCH' && path === '/nuanban/elder/profile') {
    const roleErr = assertDemoActiveRole(options, path, 'elder');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    if (data.name != null) elderProfileState.name = String(data.name);
    if (data.age != null) elderProfileState.age = Number(data.age);
    if (data.gender) elderProfileState.gender = String(data.gender);
    if (data.address != null) elderProfileState.address = String(data.address);
    if (data.emergencyContactName) elderProfileState.emergencyName = String(data.emergencyContactName);
    if (data.emergencyContactRelation) {
      elderProfileState.emergencyRelation = String(data.emergencyContactRelation);
    }
    if (data.emergencyContactPhone) elderProfileState.emergencyPhone = String(data.emergencyContactPhone);
    elderProfileState.seeded = false;
    return delay({ ok: true, ...elderSelfProfileDto() } as T);
  }
  const studentElderProfile = path.match(/^\/nuanban\/student\/elders\/([^/]+)\/profile$/);
  if (method === 'GET' && studentElderProfile) {
    const dto = elderProfileDto(studentElderProfile[1]);
    if (!dto) return Promise.reject({ message: '老人档案不存在' });
    return delay(dto as T);
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
      const dto = pendingOrderDto(order);
      recordActivity('dispatch', '机构派单', `${dto.elderName} · ${dto.serviceName}`, {
        role: 'platform',
        orderId: order.id,
      });
      persistDemoState();
    }
    return delay({ ok: true, status: order?.status || 'pending_service' } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/stats') {
    const sid = currentStudentUserId();
    const mine = state.orders.filter((o) => o.student_user === sid);
    const completed = mine.filter((o) => o.status === 'completed' && o.payment_status === 'paid');
    const pending = state.orders.filter((o) => o.status === 'pending_accept').length;
    const accepted = mine.filter((o) =>
      ['pending_service', 'in_service', 'pending_confirm', 'completed'].includes(o.status),
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
    return delay({ list: studentServiceLogs() } as T);
  }
  if (method === 'GET' && path === '/nuanban/family/service-logs') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay({ list: familyServiceLogs() } as T);
  }
  if (method === 'GET' && path === '/nuanban/elder/service-logs') {
    const roleErr = assertDemoActiveRole(options, path, 'elder');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay({ list: elderServiceLogs() } as T);
  }
  if (method === 'GET' && path.startsWith('/nuanban/student/elders/nearby')) {
    const lat = parseFloat(query.get('lat') || '0');
    const lng = parseFloat(query.get('lng') || '0');
    const radiusKm = parseFloat(query.get('radiusKm') || '5');
    const list = ELDERS.map((e) => {
      const distanceKm =
        lat && lng && e.latitude && e.longitude
          ? Math.round(haversineKm(lat, lng, e.latitude, e.longitude) * 100) / 100
          : 999;
      const profile = getRichElderProfile(e.id);
      return {
        id: e.id,
        name: e.name,
        gender: profile?.gender,
        latitude: e.latitude,
        longitude: e.longitude,
        org: e.org,
        orgName: orgNameById(e.org),
        distanceKm,
        expand: { org: { id: e.org, name: orgNameById(e.org) } },
      };
    })
      .filter((e) => e.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    return delay({ list } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/orders/pending') {
    const roleErr = assertDemoActiveRole(options, path, 'student');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const list = state.orders.filter((o) => o.status === 'pending_accept').map(pendingOrderDto);
    return delay({ list } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/orders/active') {
    const sid = currentStudentUserId();
    const list = state.orders
      .filter((o) => o.status === 'pending_service' || o.status === 'in_service')
      .filter((o) => o.student_user === sid || !o.student_user)
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
    if (order && order.status === 'pending_service') {
      order.status = 'in_service';
      mockAppendTimeline(order.id, 'in_service', '同学已开始服务', 'student');
      const dto = pendingOrderDto(order);
      recordActivity('checkin', '开始服务', `${dto.elderName} · ${dto.serviceName}`, {
        role: 'student',
        orderId: order.id,
      });
      persistDemoState();
    }
    return delay({ ok: true, status: order?.status || 'in_service' } as T);
  }
  const studentOrderCheckin = path.match(/^\/nuanban\/student\/orders\/([^/]+)\/checkin$/);
  if (method === 'POST' && studentOrderCheckin) {
    const order = state.orders.find((o) => o.id === studentOrderCheckin[1]);
    if (!order || order.status !== 'pending_service') {
      return Promise.reject({ message: '当前状态不可签到' });
    }
    order.status = 'in_service';
    mockAppendTimeline(order.id, 'in_service', '已到场签到，开始服务', 'student');
    const dto = pendingOrderDto(order);
    recordActivity('checkin', '到场签到', `${dto.elderName} · ${dto.serviceName}`, {
      role: 'student',
      orderId: order.id,
    });
    persistDemoState();
    return delay({ ok: true, status: 'in_service' } as T);
  }
  const studentOrderComplete = path.match(/^\/nuanban\/student\/orders\/([^/]+)\/complete$/);
  if (method === 'POST' && studentOrderComplete) {
    const order = state.orders.find((o) => o.id === studentOrderComplete[1]);
    if (order && order.status === 'in_service') {
      order.status = 'pending_confirm';
      order.student_user = order.student_user || currentStudentUserId();
      mockAppendTimeline(order.id, 'pending_confirm', '服务已结束，等待确认', 'student');
      const dto = pendingOrderDto(order);
      recordActivity('order_completed', '服务完成待确认', `${dto.elderName} · ${dto.serviceName}`, {
        role: 'student',
        orderId: order.id,
      });
      persistDemoState();
    }
    return delay({
      ok: true,
      status: order?.status || 'pending_confirm',
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/schedules') {
    const sid = currentStudentUserId();
    const active = state.orders.filter(
      (o) =>
        o.student_user === sid &&
        ['pending_service', 'in_service', 'pending_confirm', 'completed'].includes(o.status),
    );
    const list = active.map((o) => {
      const elder = elderById(o.elder);
      const svc = serviceById(o.service_item);
      return {
        id: `sch-${o.id}`,
        orderId: o.id,
        elderName: elder?.name || '老人',
        serviceName: svc.name,
        status: o.status,
        scheduledStart: o.scheduled_at,
      };
    });
    return delay({ list } as T);
  }
  if (method === 'GET' && path === '/nuanban/student/income') {
    const sid = currentStudentUserId();
    const completed = state.orders.filter(
      (o) =>
        o.status === 'completed' &&
        o.payment_status === 'paid' &&
        o.student_user === sid,
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
    if (alert) {
      alert.status = 'acknowledged';
      const elder = elderById(alert.elder);
      recordActivity('sos_ack', 'SOS 已确认', `${elder?.name || '老人'} · 学生已知晓`, {
        role: 'student',
      });
      persistDemoState();
    }
    return delay({ ok: true } as T);
  }

  const orderAction = path.match(/\/nuanban\/student\/order-requests\/([^/]+)\/(accept|reject)/);
  if (method === 'POST' && orderAction) {
    const id = orderAction[1];
    const action = orderAction[2];
    const order = state.orders.find((o) => o.id === id);
    if (order && action === 'accept' && order.status === 'pending_accept') {
      const svc = serviceById(order.service_item);
      order.student_user = currentStudentUserId();
      if (svc.requires_outdoor_approval) {
        order.status = 'outdoor_pending';
        if (!state.outdoorApprovals.some((a) => a.order === id)) {
          state.outdoorApprovals.push({
            id: `outdoor-${Date.now()}`,
            order: id,
            status: 'pending_family',
            family_user: order.family_user || USERS.family.id,
          });
        }
      } else {
        order.status = 'pending_service';
        mockAppendTimeline(order.id, 'pending_service', '同学已接单，请按时到场', 'student');
      }
      if (svc.requires_outdoor_approval) {
        mockAppendTimeline(order.id, 'outdoor_pending', '等待家属审批外出', 'student');
      }
      const dto = pendingOrderDto(order);
      recordActivity(
        'order_accepted',
        '学生接单',
        `${dto.elderName} · ${dto.serviceName}`,
        { role: 'student', orderId: order.id },
      );
      persistDemoState();
    } else if (order && action === 'reject') {
      const dto = pendingOrderDto(order);
      recordActivity('order_rejected', '学生拒单', `${dto.elderName} · ${dto.serviceName}`, {
        role: 'student',
        orderId: order.id,
      });
      order.student_user = undefined;
      order.status = 'pending_accept';
      persistDemoState();
    }
    return delay({ ok: true, status: order?.status || 'pending_service' } as T);
  }

  const paymentRoles: RoleKey[] = ['student', 'family', 'elder'];
  for (const pr of paymentRoles) {
    const payPath = `/nuanban/${pr}/payment-account`;
    if (method === 'GET' && path === payPath) {
      const roleErr = assertDemoActiveRole(options, path, pr);
      if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
      const user = demoUserForRoles(mockRegisterRoles);
      return delay(paymentAccountDto(user.id, pr) as T);
    }
    if (method === 'POST' && path === payPath) {
      const roleErr = assertDemoActiveRole(options, path, pr);
      if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
      const user = demoUserForRoles(mockRegisterRoles);
      const merchantNo = String(data.merchantNo || '').trim();
      const accountName = String(data.accountName || '').trim();
      if (!merchantNo || !accountName) {
        return Promise.reject({ message: '请填写商户号与账户名称', statusCode: 400 });
      }
      const tail = merchantNo.slice(-4);
      paymentAccountStore.set(paymentAccountKey(user.id, pr), {
        configured: true,
        merchantNo,
        accountName,
        accountLabel: `扫呗 · ****${tail}`,
      });
      return delay(paymentAccountDto(user.id, pr) as T);
    }
  }

  if (method === 'GET' && path === '/nuanban/family/wallet') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    const wid = resolveDemoWalletUserId(user.id, 'family');
    return delay(getWalletOverview(wid) as T);
  }
  if (method === 'POST' && path === '/nuanban/family/wallet/topup') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    const wid = resolveDemoWalletUserId(user.id, 'family');
    try {
      return delay(topupWallet(wid, Number(data.amountCents)) as T);
    } catch (e) {
      return Promise.reject({ message: (e as Error).message, statusCode: 400 });
    }
  }
  if (method === 'POST' && path === '/nuanban/family/wallet/pay-order') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    const orderId = String(data.orderId || '');
    const result = walletPayOrderForUser(user.id, orderId, 'family');
    if (!result.ok) return Promise.reject({ message: result.message, statusCode: 400 });
    return delay({ ok: true, status: result.status, overview: result.overview } as T);
  }
  if (method === 'GET' && path === '/nuanban/elder/wallet') {
    const roleErr = assertDemoActiveRole(options, path, 'elder');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    const wid = resolveDemoWalletUserId(user.id, 'elder');
    return delay(getWalletOverview(wid) as T);
  }
  if (method === 'POST' && path === '/nuanban/elder/wallet/topup') {
    const roleErr = assertDemoActiveRole(options, path, 'elder');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    const wid = resolveDemoWalletUserId(user.id, 'elder');
    try {
      return delay(topupWallet(wid, Number(data.amountCents)) as T);
    } catch (e) {
      return Promise.reject({ message: (e as Error).message, statusCode: 400 });
    }
  }
  if (method === 'POST' && path === '/nuanban/elder/wallet/pay-order') {
    const roleErr = assertDemoActiveRole(options, path, 'elder');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const user = demoUserForRoles(mockRegisterRoles);
    const orderId = String(data.orderId || '');
    const result = walletPayOrderForUser(user.id, orderId, 'elder');
    if (!result.ok) return Promise.reject({ message: result.message, statusCode: 400 });
    return delay({ ok: true, status: result.status, overview: result.overview } as T);
  }
  if (method === 'GET' && path === '/nuanban/family/stats') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    const pendingPay = state.orders.filter((o) => o.status === 'pending_payment').length;
    const pendingConfirm = state.orders.filter((o) => o.status === 'pending_confirm').length;
    const outdoorPending = state.outdoorApprovals.filter((a) => a.status === 'pending_family').length;
    const sosPending = state.sosAlerts.filter((a) => a.status === 'active').length;
    return delay({
      boundElderCount: PRIMARY_FAMILY_ELDER_IDS.length,
      pendingPaymentCount: pendingPay,
      pendingConfirmCount: pendingConfirm,
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
    if (alert) {
      alert.status = 'acknowledged';
      const elder = elderById(alert.elder);
      recordActivity('sos_ack', 'SOS 已确认', `${elder?.name || '老人'} · 家属已知晓`, {
        role: 'family',
      });
      persistDemoState();
    }
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
      studentName: caregiverNameByUserId(order.student_user),
      requiresOutdoorApproval: dto.requiresOutdoorApproval,
      timeline: dto.timeline,
      chatOpen: dto.chatOpen,
    } as T);
  }
  if (method === 'POST' && path.match(/\/nuanban\/family\/orders\/[^/]+\/pay/)) {
    const id = path.split('/')[4];
    const order = state.orders.find((o) => o.id === id);
    if (order) {
      order.status = 'pending_accept';
      order.payment_status = 'paid';
      mockAppendTimeline(order.id, 'pending_payment', '支付完成', 'family');
      mockAppendTimeline(order.id, 'pending_accept', '等待同学接单', 'system');
      const dto = pendingOrderDto(order);
      recordActivity('order_paid', '微信支付（演示）', `${dto.elderName} · ${dto.serviceName}`, {
        role: 'family',
        orderId: order.id,
      });
      persistDemoState();
    }
    return delay({ ok: true, status: order?.status || 'pending_accept' } as T);
  }
  const familyOrderConfirm = path.match(/^\/nuanban\/family\/orders\/([^/]+)\/confirm-complete$/);
  if (method === 'POST' && familyOrderConfirm) {
    const order = state.orders.find((o) => o.id === familyOrderConfirm[1]);
    if (!order || order.status !== 'pending_confirm') {
      return Promise.reject({ message: '订单不在待确认状态' });
    }
    if (order.payment_status === 'unpaid' && data.payMethod === 'wallet') {
      const user = demoUserForRoles(mockRegisterRoles);
      const payResult = walletPayOrderForUser(user.id, order.id, 'family');
      if (!payResult.ok) return Promise.reject({ message: payResult.message, statusCode: 400 });
    }
    finalizeOrderAfterConfirm(order);
    return delay({
      ok: true,
      status: 'completed',
      payment_status: order.payment_status,
    } as T);
  }
  const elderOrderConfirm = path.match(/^\/nuanban\/elder\/orders\/([^/]+)\/confirm-complete$/);
  if (method === 'POST' && elderOrderConfirm) {
    const order = state.orders.find((o) => o.id === elderOrderConfirm[1]);
    if (!order || order.status !== 'pending_confirm') {
      return Promise.reject({ message: '订单不在待确认状态' });
    }
    if (order.payment_status === 'unpaid' && data.payMethod === 'wallet') {
      const user = demoUserForRoles(mockRegisterRoles);
      const payResult = walletPayOrderForUser(user.id, order.id, 'elder');
      if (!payResult.ok) return Promise.reject({ message: payResult.message, statusCode: 400 });
    }
    finalizeOrderAfterConfirm(order);
    return delay({
      ok: true,
      status: 'completed',
      payment_status: order.payment_status,
    } as T);
  }
  if (method === 'POST' && path.match(/\/nuanban\/family\/outdoor\/[^/]+\/approve/)) {
    const id = path.split('/')[4];
    const approved = data.approved !== false;
    const approval = state.outdoorApprovals.find((a) => a.order === id || a.id === id);
    const order = state.orders.find((o) => o.id === (approval?.order || id));
    let changed = false;
    if (approval) {
      approval.status = approved ? 'approved' : 'rejected';
      changed = true;
    }
    if (order) {
      order.status = approved ? 'pending_service' : 'cancelled';
      changed = true;
      if (approved) {
        mockAppendTimeline(order.id, 'pending_service', '外出已批准，等待到场服务', 'family');
      } else {
        mockAppendTimeline(order.id, 'cancelled', '外出申请未通过，订单已取消', 'family');
      }
      const dto = pendingOrderDto(order);
      recordActivity(
        approved ? 'outdoor_approved' : 'outdoor_rejected',
        approved ? '外出已批准' : '外出已拒绝',
        `${dto.elderName} · ${dto.serviceName}`,
        { role: 'family', orderId: order.id },
      );
    }
    if (changed) persistDemoState();
    return delay({ ok: true, approved } as T);
  }

  if (method === 'GET' && path === '/nuanban/elder/stats') {
    const roleErr = assertDemoActiveRole(options, path, 'elder');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    syncMockRolesFromStorage();
    const storedRoles = mockRegisterRoles.length ? [...mockRegisterRoles] : readStoredRoles();
    const elderRole = storedRoles.find((r) => r.role === 'elder' && r.status === 'active');
    const profileId = elderRole?.elderProfileId || 'elder-zhang';
    const elderId = normalizeElderId(profileId, ELDERS);
    const elderOrders = state.orders.filter((o) => o.elder === elderId);
    const elder = elderById(elderId);
    return delay({
      elderProfileId: profileId,
      elderName: elder?.name || '张奶奶',
      orderCount: elderOrders.length,
      activeCount: elderOrders.filter((o) =>
        ['pending_accept', 'pending_service', 'in_service', 'pending_confirm', 'outdoor_pending'].includes(
          o.status,
        ),
      ).length,
      caregiverNearbyCount: CAREGIVERS.length,
    } as T);
  }
  if (method === 'GET' && path === '/nuanban/elder/caregivers/nearby') {
    return delay({ list: CAREGIVERS.map(caregiverToListItem) } as T);
  }
  const elderCaregiverDetail = path.match(/^\/nuanban\/elder\/caregivers\/([^/]+)$/);
  if (method === 'GET' && elderCaregiverDetail) {
    const dto = caregiverProfileDto(elderCaregiverDetail[1]);
    if (!dto) return Promise.reject({ message: '陪护同学不存在' });
    return delay(dto as T);
  }
  if (method === 'GET' && path === '/nuanban/elder/profile') {
    const roleErr = assertDemoActiveRole(options, path, 'elder');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay(elderSelfProfileDto() as T);
  }
  if (method === 'GET' && path === '/nuanban/family/profile') {
    const roleErr = assertDemoActiveRole(options, path, 'family');
    if (roleErr) return Promise.reject({ message: roleErr, statusCode: 403 });
    return delay(familyProfileDto() as T);
  }
  if (method === 'POST' && path === '/nuanban/elder/sos') {
    const elderId = String(data.elderId || 'elder-zhang');
    const id = `sos-${Date.now()}`;
    const elder = elderById(elderId);
    state.sosAlerts.unshift({
      id,
      elder: elderId,
      message: String(data.message || '老人发起一键求助'),
      status: 'active',
      created_at: new Date().toISOString(),
    });
    recordActivity('sos_triggered', '一键求助', `${elder?.name || '老人'} · ${String(data.message || '求助')}`, {
      role: 'elder',
    });
    persistDemoState();
    return delay({ id, ok: true } as T);
  }
  const elderOrderGet = path.match(/^\/nuanban\/elder\/orders\/([^/]+)$/);
  if (method === 'GET' && elderOrderGet) {
    const order = state.orders.find((o) => o.id === elderOrderGet[1]);
    if (!order) return Promise.reject({ message: '订单不存在' });
    const dto = pendingOrderDto(order);
    return delay({
      id: order.id,
      status: order.status,
      amount_cents: order.amount_cents,
      scheduled_at: order.scheduled_at,
      payment_status: order.payment_status,
      serviceName: dto.serviceName,
      studentName: caregiverNameByUserId(order.student_user),
      requiresOutdoorApproval: dto.requiresOutdoorApproval,
      timeline: dto.timeline,
      chatOpen: dto.chatOpen,
    } as T);
  }
  if (method === 'POST' && path === '/nuanban/elder/orders') {
    const id = `order-${Date.now()}`;
    const svc = serviceById(String(data.serviceItemId || 'svc-chat'));
    const needsOutdoor = svc.requires_outdoor_approval;
    const familyUserId = resolveDemoFamilyUserId(currentDemoUser().id);
    state.orders.push({
      id,
      elder: normalizeElderId(String(data.elderId || 'elder-zhang'), ELDERS),
      service_item: svc.id,
      status: needsOutdoor ? 'outdoor_pending' : 'pending_payment',
      amount_cents: svc.price_cents,
      payment_status: 'unpaid',
      family_user: familyUserId,
      scheduled_at: new Date().toISOString(),
    });
    mockAppendTimeline(id, 'created', '订单已创建', 'elder');
    if (needsOutdoor) {
      mockAppendTimeline(id, 'outdoor_pending', '等待家属审批外出', 'system');
    } else {
      mockAppendTimeline(id, 'pending_payment', '待支付', 'system');
    }
    if (needsOutdoor) {
      state.outdoorApprovals.push({
        id: `outdoor-${Date.now()}`,
        order: id,
        status: 'pending_family',
        family_user: familyUserId,
      });
    }
    const elder = elderById(normalizeElderId(String(data.elderId || 'elder-zhang'), ELDERS));
    recordActivity(
      'order_created',
      needsOutdoor ? '预约外出服务' : '预约服务',
      `${elder?.name || '老人'} · ${svc.name}`,
      { role: 'elder', orderId: id },
    );
    persistDemoState();
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
    const filter = query.get('filter') || '';
    const requestedUid = familyUserFromFilter(filter) || USERS.family.id;
    const items = buildFamilyElderBindings(requestedUid);
    return delay(pbList(items) as T);
  }
  if (method === 'GET' && path.startsWith('/collections/outdoor_approvals/records')) {
    const filter = query.get('filter') || '';
    const requestedUid = familyUserFromFilter(filter);
    const items = state.outdoorApprovals
      .filter((a) => a.status === 'pending_family')
      .filter((a) => !requestedUid || a.family_user === requestedUid)
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
    items = filterMockOrders(items, filter);
    return delay(pbList(items) as T);
  }
  if (method === 'GET' && path.startsWith('/collections/service_items/records')) {
    return delay(pbList(SERVICE_ITEMS.map(serviceRecord)) as T);
  }

  if (method === 'POST' && path === '/nuanban/platform/reset-demo') {
    clearAllDemoStorage();
    resetRuntimeStateInMemory();
    return delay({ ok: true } as T);
  }
  if (method === 'POST' && path === '/nuanban/platform/seed-scenario') {
    const result = seedOutdoorWalkScenario();
    return delay({ ok: true, ...result } as T);
  }
  if (method === 'GET' && path === '/nuanban/platform/activity') {
    return delay({ list: state.activityEvents.slice(0, 20) } as T);
  }

  if (method === 'GET' && path === '/nuanban/platform/funds/overview') {
    return delay(getAdminFundOverview() as T);
  }
  if (method === 'GET' && path === '/nuanban/platform/funds/topups') {
    return delay({ list: listAdminTopups() } as T);
  }
  if (method === 'GET' && path === '/nuanban/platform/funds/payments') {
    return delay({ list: listAdminPayments() } as T);
  }
  if (method === 'GET' && path === '/nuanban/platform/funds/withdrawals') {
    const status = query.get('status') as 'pending' | 'completed' | 'rejected' | null;
    return delay({
      list: listAdminWithdrawals(status ? { status } : undefined),
    } as T);
  }
  const fundWdApprove = path.match(/^\/nuanban\/platform\/funds\/withdrawals\/([^/]+)\/approve$/);
  if (method === 'POST' && fundWdApprove) {
    const record = approveAdminWithdrawal(fundWdApprove[1]);
    if (!record) return Promise.reject({ message: '提现记录不存在或已处理', statusCode: 400 });
    return delay({ ok: true, record } as T);
  }
  const fundWdReject = path.match(/^\/nuanban\/platform\/funds\/withdrawals\/([^/]+)\/reject$/);
  if (method === 'POST' && fundWdReject) {
    const reason = String(data.reason || '');
    const record = rejectAdminWithdrawal(fundWdReject[1], reason);
    if (!record) return Promise.reject({ message: '提现记录不存在或已处理', statusCode: 400 });
    return delay({ ok: true, record } as T);
  }
  if (method === 'POST' && path === '/nuanban/platform/funds/reconcile') {
    const recordId = String(data.recordId || '');
    if (!recordId) return Promise.reject({ message: '缺少 recordId', statusCode: 400 });
    return delay(markFundReconciled(recordId) as T);
  }

  if (method === 'GET' && path === '/nuanban/platform/students') {
    const caregivers = buildRichCaregivers();
    const list = caregivers.map((c) => {
      const profile = getRichCaregiverProfile(c.userId)!;
      const cartoonId = getMockCartoonAvatarId(c.userId) || defaultCartoonAvatarId(c.name);
      return {
        userId: c.userId,
        displayName: c.name,
        nickname: c.name,
        email:
          c.userId === DEMO_USERS.student.id
            ? DEMO_USERS.student.email
            : `${c.userId}@test.nuanban.dev`,
        schoolName: c.school,
        status: mockStudentStatusOverrides[c.userId] || 'active',
        cartoonAvatarId: cartoonId,
        avatarUrl: resolveCartoonAvatarUrl(cartoonId),
        verificationPhotoUrl: getMockVerificationPhotoUrl(c.userId) || undefined,
        major: profile.major,
        grade: profile.grade,
        phone: profile.phone,
        gender: profile.gender,
      };
    });
    list.push({
      userId: DEMO_USERS.studentPending.id,
      displayName: DEMO_USERS.studentPending.nickname,
      nickname: DEMO_USERS.studentPending.nickname,
      email: DEMO_USERS.studentPending.email,
      schoolName: '示范大学',
      status: mockStudentStatusOverrides[DEMO_USERS.studentPending.id] || 'pending',
      cartoonAvatarId: defaultCartoonAvatarId(DEMO_USERS.studentPending.nickname),
      avatarUrl: resolveCartoonAvatarUrl(defaultCartoonAvatarId(DEMO_USERS.studentPending.nickname)),
      major: '社会学',
      grade: '大二',
      phone: '138****0003',
      gender: '女',
    });
    const statusQ = query.get('status') || '';
    const filtered =
      statusQ === 'pending' || statusQ === 'active' || statusQ === 'rejected'
        ? list.filter((s) => s.status === statusQ)
        : list;
    const page = Math.max(1, parseInt(query.get('page') || '1', 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(query.get('pageSize') || '50', 10) || 50));
    const offset = (page - 1) * pageSize;
    const slice = filtered.slice(offset, offset + pageSize);
    return delay({
      list: slice,
      total: filtered.length,
      page,
      pageSize,
      hasMore: offset + slice.length < filtered.length,
    } as T);
  }

  const studentStatusPost = path.match(/^\/nuanban\/platform\/students\/([^/]+)\/status$/);
  if (method === 'POST' && studentStatusPost) {
    const uid = studentStatusPost[1];
    const status = String(data.status || '');
    if (!['active', 'rejected', 'pending'].includes(status)) {
      return Promise.reject({ message: 'status 须为 active / rejected / pending', statusCode: 400 });
    }
    mockStudentStatusOverrides[uid] = status;
    return delay({ ok: true, userId: uid, status } as T);
  }

  if (method === 'GET' && path === '/nuanban/platform/sos/active') {
    const list = state.sosAlerts.filter((a) => a.status === 'active').map(sosDto);
    return delay({ list } as T);
  }

  const orderMsgGet = path.match(/^\/nuanban\/orders\/([^/]+)\/messages$/);
  if (method === 'GET' && orderMsgGet) {
    const oid = orderMsgGet[1];
    const order = state.orders.find((o) => o.id === oid);
    if (!order) return Promise.reject({ message: '订单不存在' });
    const list = (mockOrderMessages[oid] || []).map((m) => mockOrderMessageDto(m, currentChatSender().userId));
    return delay({ list, threadOpen: mockChatOpen(order.status) } as T);
  }
  if (method === 'POST' && orderMsgGet) {
    const oid = orderMsgGet[1];
    const order = state.orders.find((o) => o.id === oid);
    if (!order) return Promise.reject({ message: '订单不存在' });
    if (!mockChatOpen(order.status)) {
      return Promise.reject({ message: '本单沟通通道已关闭' });
    }
    const sender = currentChatSender();
    const msgType = String((data as { type?: string }).type || 'text');
    let msg;
    if (msgType === 'voice') {
      const audioBase64 = String((data as { audioBase64?: string }).audioBase64 || '').trim();
      const durationSec = Math.max(1, Math.min(60, Number((data as { durationSec?: number }).durationSec) || 1));
      if (!audioBase64) return Promise.reject({ message: '语音数据不能为空' });
      if (audioBase64.length > 400000) {
        return Promise.reject({ message: '语音过大，请缩短录音后重试' });
      }
      msg = {
        id: `msg_${oid}_${Date.now()}`,
        orderId: oid,
        senderUser: sender.userId,
        senderRole: sender.role,
        senderAlias: sender.alias,
        type: 'voice' as const,
        body: '',
        audioBase64,
        mimeType: String((data as { mimeType?: string }).mimeType || 'audio/mpeg'),
        durationSec,
        createdAt: new Date().toISOString(),
      };
    } else {
      const body = String((data as { body?: string }).body || '').trim();
      if (!body) return Promise.reject({ message: '消息不能为空' });
      msg = {
        id: `msg_${oid}_${Date.now()}`,
        orderId: oid,
        senderUser: sender.userId,
        senderRole: sender.role,
        senderAlias: sender.alias,
        type: 'text' as const,
        body,
        createdAt: new Date().toISOString(),
      };
    }
    if (!mockOrderMessages[oid]) mockOrderMessages[oid] = [];
    mockOrderMessages[oid].push(msg);
    return delay({ ok: true, message: mockOrderMessageDto(msg, sender.userId) } as T);
  }

  if (method === 'GET' && path === '/nuanban/debug/stress') {
    const fail = String((options as { query?: Record<string, string> })?.query?.fail || '');
    if (fail === '500' || fail === '503') {
      return Promise.reject({ message: 'stress injected failure', statusCode: parseInt(fail, 10) });
    }
    const delayMs = parseInt(String((options as { query?: Record<string, string> })?.query?.delay || '0'), 10);
    if (delayMs > 0) {
      return new Promise((resolve) => setTimeout(() => resolve({ ok: true, delayMs } as T), Math.min(delayMs, 3000)));
    }
    return delay({ ok: true, delayMs: 0 } as T);
  }

  if (method === 'GET' && path === '/nuanban/platform/overview') {
    const pending = state.orders.filter((o) => o.status === 'pending_accept').length;
    const pendingPay = state.orders.filter((o) => o.status === 'pending_payment').length;
    const pendingConfirm = state.orders.filter((o) => o.status === 'pending_confirm').length;
    const inSvc = state.orders.filter((o) => o.status === 'in_service').length;
    const done = state.orders.filter((o) => o.status === 'completed').length;
    const sosActive = state.sosAlerts.filter((a) => a.status === 'active').length;
    let studentsPendingCount = 0;
    if ((mockStudentStatusOverrides[DEMO_USERS.studentPending.id] || 'pending') === 'pending') {
      studentsPendingCount += 1;
    }
    for (const c of buildRichCaregivers()) {
      if (mockStudentStatusOverrides[c.userId] === 'pending') studentsPendingCount += 1;
    }
    const pendingWd = getAdminFundOverview().pendingWithdrawalCount;
    const walletPaidCents = state.orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((s, o) => s + o.amount_cents, 0);
    return delay({
      mission: APP_TAGLINE,
      updatedAt: new Date().toISOString(),
      eldersTotal: ELDERS.length,
      studentsActive: CAREGIVERS.length,
      ordersPendingAccept: pending,
      ordersPendingPayment: pendingPay,
      ordersPendingConfirm: pendingConfirm,
      ordersInService: inSvc,
      ordersCompleted: done,
      studentsPendingCount: studentsPendingCount,
      sosActiveCount: sosActive,
      pendingWithdrawalCount: pendingWd,
      walletPaidTotalCents: walletPaidCents,
      walletPaidTotalYuan: (walletPaidCents / 100).toFixed(2),
      serviceLogCount: state.serviceLogs.length,
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
          description: '老人按距离浏览大学生志愿者并预约',
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

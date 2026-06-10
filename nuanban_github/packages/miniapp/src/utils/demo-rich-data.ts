/**
 * 公网演示富数据集 — 多老人/多订单/多状态，用于界面与压力场景测试（零后端成本）
 */

export const DEMO_ORG_MAIN = { id: 'org-demo', name: '暖伴示范养老院' };
export const DEMO_ORG_EAST = { id: 'org-east', name: '城东颐养中心' };

/** 机构合作学校 — 学生「学校合作」筛选依据 */
export const ORG_SCHOOL_PARTNERS: Record<string, string[]> = {
  [DEMO_ORG_MAIN.id]: ['示范大学', '医科大学'],
  [DEMO_ORG_EAST.id]: ['城东师范学院', '示范大学'],
};

export const DEMO_SCHOOLS = ['示范大学', '城东师范学院', '医科大学'] as const;

export const DEMO_USERS = {
  student: { id: 'user-student', email: 'student1@test.nuanban.dev', nickname: '林同学' },
  studentPending: { id: 'user-student-pending', email: 'student3@test.nuanban.dev', nickname: '待审同学' },
  family: { id: 'user-family', email: 'family1@test.nuanban.dev', nickname: '家属1' },
  elder: { id: 'user-elder', email: 'elder1@test.nuanban.dev', nickname: '老人1' },
  multi: { id: 'user-multi', email: 'multi1@test.nuanban.dev', nickname: '多角色演示' },
} as const;

/** 演示手机号 → 角色测试账号（与 pb_hooks phoneToEmail 对齐） */
export interface DemoTestPhone {
  phone: string;
  email: string;
  role: 'student' | 'family' | 'elder' | 'multi';
  label: string;
  /** 可测场景简述 */
  testHint: string;
}

export const DEMO_TEST_PHONES: DemoTestPhone[] = [
  {
    phone: '13800000001',
    email: DEMO_USERS.student.email,
    role: 'student',
    label: '林同学 · 学生主流程',
    testHint: '接单、签到、收入、推荐有奖',
  },
  {
    phone: '13800000002',
    email: 'student2@test.nuanban.dev',
    role: 'student',
    label: '周同学 · 城东师范',
    testHint: '学校合作筛选、合作机构老人',
  },
  {
    phone: '13800000003',
    email: DEMO_USERS.studentPending.email,
    role: 'student',
    label: '待审同学',
    testHint: '审核中页、无法接单',
  },
  {
    phone: '13800000004',
    email: DEMO_USERS.family.email,
    role: 'family',
    label: '家属1',
    testHint: '储值卡、代付、外出审批、SOS、服务包',
  },
  {
    phone: '13800000005',
    email: DEMO_USERS.elder.email,
    role: 'elder',
    label: '老人1',
    testHint: '储值卡、找陪护、预约、一键求助',
  },
  {
    phone: '13800000006',
    email: DEMO_USERS.multi.email,
    role: 'multi',
    label: '多角色演示',
    testHint: '学生/家属/老人身份切换',
  },
];

export const DEMO_PHONE_EMAIL: Record<string, string> = Object.fromEntries(
  DEMO_TEST_PHONES.map((p) => [p.phone, p.email]),
);

/** 家属可购服务包 — 演示数据 */
export interface ServicePackage {
  id: string;
  name: string;
  desc: string;
  priceYuan: number;
  sessionsPerMonth: number;
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  { id: 'pkg-basic', name: '基础陪护包', desc: '每月 4 次聊天陪伴', priceYuan: 199, sessionsPerMonth: 4 },
  { id: 'pkg-rehab', name: '康复关爱包', desc: '每月 2 次康复协助 + 2 次生活陪护', priceYuan: 399, sessionsPerMonth: 4 },
  { id: 'pkg-family', name: '全家安心包', desc: '含外出陪同审批优先通道', priceYuan: 599, sessionsPerMonth: 6 },
];

/** 学生结算记录 — 演示数据 */
export interface SettlementRecord {
  id: string;
  period: string;
  amountCents: number;
  status: 'pending' | 'paid';
  paidAt?: string;
}

export const SETTLEMENTS: SettlementRecord[] = [
  { id: 'stl-2025-04', period: '2025-04', amountCents: 24800, status: 'paid', paidAt: '2025-05-05' },
  { id: 'stl-2025-05', period: '2025-05', amountCents: 28500, status: 'paid', paidAt: '2025-06-01' },
  { id: 'stl-2025-06', period: '2025-06', amountCents: 35200, status: 'pending' },
];

export type RichOrderStatus =
  | 'pending_accept'
  | 'pending_payment'
  | 'outdoor_pending'
  | 'pending_service'
  | 'in_service'
  | 'pending_confirm'
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

  // 待接单池（压力：15 单）
  for (let i = 0; i < 15; i++) push(i, i, 'pending_accept', 86400000 * (1 + i * 0.25));

  // 待支付（5 单）
  for (let i = 0; i < 5; i++) push(i + 1, i + 2, 'pending_payment', 172800000 + i * 3600000);

  // 外出待批（2 单）
  push(2, 7, 'outdoor_pending', 259200000);
  push(4, 8, 'outdoor_pending', 302400000);

  // 待服务 + 服务中（学生）
  push(0, 3, 'pending_service', 7200000, { student_user: student });
  push(1, 4, 'pending_service', 10800000, { student_user: student });
  push(0, 3, 'in_service', -3600000, { student_user: student, payment_status: 'unpaid' });
  push(2, 5, 'in_service', -5400000, { student_user: student, payment_status: 'paid' });

  // 待确认 + 张奶奶待支付（老人端「我的服务」演示）
  push(0, 0, 'pending_payment', 43200000);
  push(0, 1, 'pending_confirm', -7200000, { student_user: student, payment_status: 'paid' });
  push(0, 2, 'pending_confirm', -10800000, { student_user: student });

  // 已完成历史（收入压力：12 单）
  for (let i = 0; i < 12; i++) {
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

/** —— Phase 19：详尽个人资料 —— */

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface RichElderProfile extends RichElder {
  gender: string;
  district: string;
  address: string;
  healthStatus: string;
  mobility: string;
  hobbies: string[];
  servicePreferences: string[];
  livingSituation: string;
  emergencyContact: EmergencyContact;
  preferredVisitTimes: string[];
  notes: string;
}

export interface RichCaregiverProfile extends RichCaregiver {
  gender: string;
  major: string;
  grade: string;
  age: number;
  phone: string;
  bio: string;
  serviceAreas: string[];
  availableHours: string[];
  certifications: string[];
  languages: string[];
  personalityTags: string[];
  serviceTypes: string[];
  completedOrderThemes: string[];
  reviewSummary: string;
}

export interface StudentFullProfile {
  nickname: string;
  email: string;
  displayName: string;
  schoolName: string;
  gender: string;
  major: string;
  grade: string;
  age: number;
  phone: string;
  bio: string;
  serviceAreas: string[];
  availableHours: string[];
  certifications: string[];
  languages: string[];
  personalityTags: string[];
  serviceTypes: string[];
  completedOrderThemes: string[];
  rating: number;
  orderCount: number;
}

export interface FamilyProfile {
  nickname: string;
  email: string;
  relationToElder: string;
  linkedElderName: string;
  linkedElderId: string;
  contactPhone: string;
  district: string;
  address: string;
  notificationPrefs: string[];
}

export interface ElderSelfProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  district: string;
  address: string;
  orgName: string;
  healthStatus: string;
  mobility: string;
  hobbies: string[];
  servicePreferences: string[];
  livingSituation: string;
  emergencyContact: EmergencyContact;
  preferredVisitTimes: string[];
  notes: string;
}

const DISTRICTS = ['浦东新区', '黄浦区', '静安区', '徐汇区', '杨浦区', '虹口区', '长宁区', '普陀区'];
const HOBBIES_POOL = [
  ['听戏', '养花', '看报纸'],
  ['下棋', '听广播', '散步'],
  ['看电视', '编织', '聊天'],
  ['书法', '太极拳', '摄影'],
  ['唱歌', '烹饪', '园艺'],
  ['读书', '听评书', '做手工'],
  ['广场舞', '剪纸', '看老电影'],
  ['钓鱼', '集邮', '养鸟'],
];
const SERVICE_PREFS = [
  ['聊天陪伴', '读报陪聊'],
  ['康复协助', '陪同散步'],
  ['生活陪护', '用药提醒'],
  ['棋牌陪伴', '聊天陪伴'],
  ['康复协助', '生活陪护'],
  ['耐心陪伴', '读报陪聊'],
  ['陪同散步', '聊天陪伴'],
  ['听戏陪聊', '生活陪护'],
];
const LIVING = ['与子女同住', '独居（有保姆）', '独居', '与配偶同住', '机构养老', '与子女同住', '独居', '与配偶同住'];
const HEALTH = ['总体良好', '需康复协助', '高血压需监测', '听力下降', '术后恢复中', '认知轻度减退', '行动自如', '慢性病稳定'];
const MOBILITY = ['行动便利', '需搀扶', '可短距离步行', '行动便利', '需轮椅辅助', '行动较慢', '行动便利', '需搀扶'];

const MAJORS = ['护理学', '社会工作', '心理学', '康复治疗', '老年服务与管理', '临床医学'];
const GRADES = ['大二', '大三', '大四', '研一', '研二', '大三'];
const PERSONALITY = [
  ['耐心细致', '开朗活泼'],
  ['温柔体贴', '认真负责'],
  ['活泼健谈', '细心周到'],
  ['沉稳可靠', '善于倾听'],
  ['热情开朗', '有耐心'],
  ['文静内敛', '做事踏实'],
];
const SERVICE_TYPES = [
  ['陪伴聊天', '读报陪聊', '康复协助'],
  ['生活陪护', '用药提醒'],
  ['棋牌陪伴', '聊天陪伴'],
  ['外出陪同', '陪同散步'],
  ['读报陪聊', '生活陪护'],
  ['康复协助', '用药提醒'],
];
const ORDER_THEMES = [
  ['聊天陪伴 ×12', '康复协助 ×5', '读报陪聊 ×8'],
  ['生活陪护 ×10', '用药提醒 ×6'],
  ['棋牌陪伴 ×7', '聊天陪伴 ×9'],
  ['外出陪同 ×4', '陪同散步 ×6'],
  ['读报陪聊 ×11', '生活陪护 ×3'],
  ['康复协助 ×8', '用药提醒 ×5'],
];
const REVIEW_SUMMARIES = [
  '老人评价「很有耐心，聊天很开心」',
  '家属反馈「用药提醒很及时，放心」',
  '机构备注「康复协助动作规范」',
  '老人说「下棋很开心，下次还想约」',
  '家属称赞「读报声音好听，老人爱听」',
  '多次复购，服务稳定可靠',
];

function maskPhone(seed: number): string {
  const tail = String(1000 + (seed % 9000));
  return `138****${tail}`;
}

function maskAddress(district: string, seed: number): string {
  const roads = ['花木路', '张杨路', '南京东路', '淮海中路', '四平路', '四川北路'];
  return `${district}${roads[seed % roads.length]}${(seed % 200) + 1}号***室`;
}

const ELDER_PROFILE_CACHE = new Map<string, RichElderProfile>();

function buildElderProfile(base: RichElder, idx: number): RichElderProfile {
  const district = DISTRICTS[idx % DISTRICTS.length];
  return {
    ...base,
    gender: idx % 2 === 0 ? '女' : '男',
    district,
    address: maskAddress(district, idx + 1),
    healthStatus: HEALTH[idx % HEALTH.length],
    mobility: MOBILITY[idx % MOBILITY.length],
    hobbies: [...HOBBIES_POOL[idx % HOBBIES_POOL.length]],
    servicePreferences: [...SERVICE_PREFS[idx % SERVICE_PREFS.length]],
    livingSituation: LIVING[idx % LIVING.length],
    emergencyContact: {
      name: idx % 2 === 0 ? '王女士' : '李先生',
      relation: idx % 3 === 0 ? '女儿' : idx % 3 === 1 ? '儿子' : '儿媳',
      phone: maskPhone(idx + 10),
    },
    preferredVisitTimes: ['工作日下午 14:00–17:00', '周末上午 9:00–11:00'],
    notes: `${base.name}喜欢温馨氛围，初次见面可先聊家常再开展服务。`,
  };
}

export function getRichElderProfile(id: string): RichElderProfile | null {
  const elders = buildRichElders();
  const nid = normalizeElderId(id, elders);
  if (ELDER_PROFILE_CACHE.has(nid)) return ELDER_PROFILE_CACHE.get(nid)!;
  const base = elders.find((e) => e.id === nid);
  if (!base) return null;
  const idx = elders.findIndex((e) => e.id === nid);
  const profile = buildElderProfile(base, idx);
  ELDER_PROFILE_CACHE.set(nid, profile);
  return profile;
}

const CAREGIVER_PROFILE_CACHE = new Map<string, RichCaregiverProfile>();

function buildCaregiverProfile(base: RichCaregiver, idx: number): RichCaregiverProfile {
  return {
    ...base,
    gender: '女',
    major: MAJORS[idx % MAJORS.length],
    grade: GRADES[idx % GRADES.length],
    age: 20 + (idx % 4),
    phone: maskPhone(idx + 20),
    bio: `${base.name}，${base.school}${GRADES[idx % GRADES.length]}学生。热心公益，累计服务 ${base.orderCount} 次，擅长${base.tags.join('、')}。`,
    serviceAreas: ['浦东新区', '黄浦区'].slice(0, 1 + (idx % 2)),
    availableHours: ['周一至周五 14:00–18:00', '周六 9:00–12:00'],
    certifications: idx % 2 === 0 ? ['急救员证', '养老护理员初级'] : ['红十字救护员'],
    languages: ['普通话', idx % 3 === 0 ? '上海话' : '英语基础'],
    personalityTags: [...PERSONALITY[idx % PERSONALITY.length]],
    serviceTypes: [...SERVICE_TYPES[idx % SERVICE_TYPES.length]],
    completedOrderThemes: [...ORDER_THEMES[idx % ORDER_THEMES.length]],
    reviewSummary: REVIEW_SUMMARIES[idx % REVIEW_SUMMARIES.length],
  };
}

export function getRichCaregiverProfile(idOrUserId: string): RichCaregiverProfile | null {
  const caregivers = buildRichCaregivers();
  const key = idOrUserId;
  if (CAREGIVER_PROFILE_CACHE.has(key)) return CAREGIVER_PROFILE_CACHE.get(key)!;
  const base =
    caregivers.find((c) => c.id === idOrUserId || c.userId === idOrUserId) || caregivers[0];
  const idx = caregivers.findIndex((c) => c.id === base.id);
  const profile = buildCaregiverProfile(base, idx >= 0 ? idx : 0);
  CAREGIVER_PROFILE_CACHE.set(key, profile);
  CAREGIVER_PROFILE_CACHE.set(base.id, profile);
  CAREGIVER_PROFILE_CACHE.set(base.userId, profile);
  return profile;
}

const DEFAULT_STUDENT_EXTRAS = {
  gender: '女',
  major: '护理学',
  grade: '大三',
  age: 21,
  phone: maskPhone(1),
  bio: '热心公益的在校女生，擅长陪伴聊天与康复协助，希望用课余时间为附近老人送去温暖。',
  serviceAreas: ['浦东新区', '黄浦区'],
  availableHours: ['周一至周五 14:00–18:00', '周六 9:00–12:00'],
  certifications: ['急救员证', '养老护理员初级'],
  languages: ['普通话', '上海话'],
  personalityTags: ['耐心细致', '开朗活泼'],
  serviceTypes: ['陪伴聊天', '读报陪聊', '康复协助'],
  completedOrderThemes: ['聊天陪伴 ×12', '康复协助 ×5', '读报陪聊 ×8'],
};

export function getStudentFullProfile(
  overrides?: Partial<StudentFullProfile & { displayName?: string; schoolName?: string }>,
): StudentFullProfile {
  const cg = getRichCaregiverProfile(DEMO_USERS.student.id)!;
  return {
    nickname: overrides?.displayName || DEMO_USERS.student.nickname,
    email: DEMO_USERS.student.email,
    displayName: overrides?.displayName || DEMO_USERS.student.nickname,
    schoolName: overrides?.schoolName || cg.school,
    gender: overrides?.gender ?? DEFAULT_STUDENT_EXTRAS.gender,
    major: overrides?.major ?? DEFAULT_STUDENT_EXTRAS.major,
    grade: overrides?.grade ?? DEFAULT_STUDENT_EXTRAS.grade,
    age: overrides?.age ?? DEFAULT_STUDENT_EXTRAS.age,
    phone: overrides?.phone ?? DEFAULT_STUDENT_EXTRAS.phone,
    bio: overrides?.bio ?? DEFAULT_STUDENT_EXTRAS.bio,
    serviceAreas: overrides?.serviceAreas ?? DEFAULT_STUDENT_EXTRAS.serviceAreas,
    availableHours: overrides?.availableHours ?? DEFAULT_STUDENT_EXTRAS.availableHours,
    certifications: overrides?.certifications ?? DEFAULT_STUDENT_EXTRAS.certifications,
    languages: overrides?.languages ?? DEFAULT_STUDENT_EXTRAS.languages,
    personalityTags: overrides?.personalityTags ?? DEFAULT_STUDENT_EXTRAS.personalityTags,
    serviceTypes: overrides?.serviceTypes ?? DEFAULT_STUDENT_EXTRAS.serviceTypes,
    completedOrderThemes:
      overrides?.completedOrderThemes ?? DEFAULT_STUDENT_EXTRAS.completedOrderThemes,
    rating: cg.rating,
    orderCount: cg.orderCount,
  };
}

export function getFamilyProfile(): FamilyProfile {
  const elder = getRichElderProfile('elder-1')!;
  return {
    nickname: DEMO_USERS.family.nickname,
    email: DEMO_USERS.family.email,
    relationToElder: '女儿',
    linkedElderName: elder.name,
    linkedElderId: elder.id,
    contactPhone: maskPhone(99),
    district: elder.district,
    address: maskAddress(elder.district, 99),
    notificationPrefs: ['订单状态变更', '外出审批提醒', 'SOS 紧急通知', '支付成功通知'],
  };
}

export function getElderSelfProfile(): ElderSelfProfile {
  const profile = getRichElderProfile('elder-1')!;
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    gender: profile.gender,
    district: profile.district,
    address: profile.address,
    orgName: orgNameById(profile.org),
    healthStatus: profile.healthStatus,
    mobility: profile.mobility,
    hobbies: profile.hobbies,
    servicePreferences: profile.servicePreferences,
    livingSituation: profile.livingSituation,
    emergencyContact: profile.emergencyContact,
    preferredVisitTimes: profile.preferredVisitTimes,
    notes: profile.notes,
  };
}

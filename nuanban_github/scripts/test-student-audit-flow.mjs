#!/usr/bin/env node
/**
 * 学生审核流程 API 自动化冒烟测试（parity · formal auth）
 * 用法: node scripts/test-student-audit-flow.mjs
 */
const BASE = process.env.NUANBAN_API || 'http://127.0.0.1:8090';

const TOPIC_POOLS = {
  动物: ['🐱', '🐶', '🐰', '🐻', '🦁', '🐼', '🐮', '🐷'],
  水果: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍑', '🍊', '🥝'],
  交通工具: ['🚗', '🚌', '✈️', '🚲', '🚢', '🚆', '🛵', '🚕'],
  食物: ['🍜', '🍚', '🥟', '🍞', '🥗', '🍕', '🌮', '🍲'],
};

const AUDIT_FIELDS = [
  'displayName',
  'contactPhone',
  'studentId',
  'schoolName',
  'gender',
  'major',
  'grade',
  'cartoonAvatarId',
  'customCartoonAvatarUrl',
  'verificationPhotoUrl',
  'serviceAreaPolygons',
  'serviceHours',
  'auditStatus',
  'auditLocked',
];

const FORBIDDEN_FIELDS = ['bio', 'wechatId'];

async function json(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5174',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

function topicFromPrompt(prompt) {
  const m = String(prompt || '').match(/【(.+?)】/);
  return m ? m[1] : null;
}

function solveCaptcha(challenge) {
  const topic = topicFromPrompt(challenge.prompt);
  const pool = TOPIC_POOLS[topic];
  if (!pool) throw new Error(`unknown captcha topic: ${topic}`);
  const selectedIds = challenge.tiles
    .filter((t) => pool.includes(t.emoji))
    .map((t) => t.id);
  if (!selectedIds.length) throw new Error('no captcha tiles matched topic');
  return selectedIds;
}

async function phoneLogin(phone) {
  const ch = await json('GET', '/api/nuanban/captcha/challenge');
  if (ch.status !== 200) throw new Error(`captcha challenge ${ch.status}`);
  const selectedIds = solveCaptcha(ch.data);
  const ver = await json('POST', '/api/nuanban/captcha/verify', {
    challengeId: ch.data.challengeId,
    selectedIds,
  });
  if (ver.status !== 200 || !ver.data.captchaToken) {
    throw new Error(`captcha verify failed: ${JSON.stringify(ver.data)}`);
  }
  const sms = await json('POST', '/api/nuanban/sms/send', {
    phone,
    captchaToken: ver.data.captchaToken,
  });
  if (sms.status !== 200) throw new Error(`sms send failed: ${JSON.stringify(sms.data)}`);
  let code = sms.data.devCode;
  if (!code) {
    const outbox = await json('GET', '/api/nuanban/platform/sms-outbox?key=nuanban2026');
    code = outbox.data?.list?.find((r) => r.phone === phone)?.code;
  }
  if (!code) throw new Error('no sms code from outbox');
  const login = await json('POST', '/api/nuanban/phone-login', { phone, code });
  if (login.status !== 200 || !login.data.token) {
    throw new Error(`phone-login failed: ${JSON.stringify(login.data)}`);
  }
  return login.data;
}

function assert(name, ok, detail = '') {
  return { name, ok, detail };
}

async function main() {
  const results = [];

  // 1. Health
  const health = await json('GET', '/api/health');
  results.push(assert('API 健康检查', health.status === 200 && health.data.code === 200));

  // 2. Captcha
  const cap = await json('GET', '/api/nuanban/captcha/challenge');
  results.push(assert(
    '验证码挑战接口',
    cap.status === 200 && cap.data.challengeId && Array.isArray(cap.data.tiles),
  ));

  // 3. dev-login blocked in formal mode
  const devLogin = await json('POST', '/api/nuanban/dev-login', { email: 'student1@test.nuanban.dev' });
  results.push(assert('正式模式禁用 dev-login', devLogin.status === 403));

  // 4. Active student (13800000001)
  const activeLogin = await phoneLogin('13500000001');
  results.push(assert(
    '已通过学生登录',
    !!activeLogin.token && activeLogin.roles?.some((r) => r.role === 'student' && r.status === 'active'),
  ));

  const activeToken = activeLogin.token;
  const profile = await json('GET', '/api/nuanban/student/profile', null, {
    Authorization: `Bearer ${activeToken}`,
    'X-Active-Role': 'student',
  });
  results.push(assert('GET 学生资料', profile.status === 200));
  results.push(assert(
    'auditLocked=true（已通过）',
    profile.data.auditLocked === true && profile.data.auditStatus === 'active',
  ));
  const hasAuditFields = AUDIT_FIELDS.every((k) => k in profile.data);
  results.push(assert('DTO 含审核字段', hasAuditFields, JSON.stringify(Object.keys(profile.data))));
  const noForbidden = FORBIDDEN_FIELDS.every((k) => !(k in profile.data));
  results.push(assert('DTO 不含 bio/微信号旧字段', noForbidden));
  results.push(assert(
    'DTO 含服务区域与时段',
    Array.isArray(profile.data.serviceAreaPolygons) && Array.isArray(profile.data.serviceHours),
  ));

  const activeWithdrawal = await json('GET', '/api/nuanban/student/withdrawal', null, {
    Authorization: `Bearer ${activeToken}`,
    'X-Active-Role': 'student',
  });
  results.push(assert(
    '演示号学生可提现 ¥533',
    activeWithdrawal.status === 200 && activeWithdrawal.data.availableCents === 53300,
    `status=${activeWithdrawal.status} available=${activeWithdrawal.data?.availableCents}`,
  ));

  const patchLocked = await json(
    'PATCH',
    '/api/nuanban/student/profile',
    { displayName: '测试改名' },
    { Authorization: `Bearer ${activeToken}`, 'X-Active-Role': 'student' },
  );
  results.push(assert(
    'active 无 resubmitAudit → 403',
    patchLocked.status === 403,
    patchLocked.data?.message || '',
  ));

  const patchResubmit = await json(
    'PATCH',
    '/api/nuanban/student/profile',
    { displayName: profile.data.displayName, resubmitAudit: true },
    { Authorization: `Bearer ${activeToken}`, 'X-Active-Role': 'student' },
  );
  results.push(assert(
    'resubmitAudit → pending',
    patchResubmit.status === 200 && patchResubmit.data.auditStatus === 'pending',
  ));

  // Restore active for seed account (ops would normally approve)
  if (patchResubmit.status === 200) {
    const opsLogin = await phoneLogin('13500000001');
    // student now pending — use platform API if available
    const uid = opsLogin.user?.id || activeLogin.user?.id;
    if (uid) {
      const restore = await json(
        'POST',
        `/api/nuanban/platform/students/${uid}/status`,
        { status: 'active' },
        { Authorization: `Bearer ${opsLogin.token}` },
      );
      results.push(assert(
        '恢复 seed 学生为 active（测试清理）',
        restore.status === 200,
        restore.data?.message || String(restore.status),
      ));
    }
  }

  // 5. Pending student (13800000003)
  const pendingLogin = await phoneLogin('13500000003');
  results.push(assert(
    '待审学生登录 roles=pending',
    pendingLogin.roles?.some((r) => r.role === 'student' && r.status === 'pending'),
  ));
  const pendingProfile = await json('GET', '/api/nuanban/student/profile', null, {
    Authorization: `Bearer ${pendingLogin.token}`,
    'X-Active-Role': 'student',
  });
  results.push(assert(
    '待审学生 auditLocked=false',
    pendingProfile.status === 200 && pendingProfile.data.auditLocked === false,
  ));

  // 6. Schools list
  const schools = await json('GET', '/api/nuanban/schools');
  results.push(assert('学校列表接口', schools.status === 200 && Array.isArray(schools.data.list)));

  // 7. 新手机号注册应进入 pending 并保存资料字段
  const newPhone = '139' + String(Date.now()).slice(-8);
  const newLogin = await phoneLogin(newPhone);
  results.push(assert('新手机号登录 roles 为空', (newLogin.roles || []).length === 0));
  const reg = await json(
    'POST',
    '/api/nuanban/auth/register',
    {
      role: 'student',
      contactPhone: newPhone,
      displayName: '测试新同学',
      schoolName: '示范大学',
      gender: '女',
      major: '社会学',
      grade: '大二',
      studentId: 'S2026001',
      cartoonAvatarId: 'msn-happy',
      serviceAreaPolygons: [
        {
          id: 't1',
          label: '测试区',
          ring: [
            { lat: 31.22, lng: 121.52 },
            { lat: 31.24, lng: 121.56 },
            { lat: 31.2, lng: 121.58 },
          ],
        },
      ],
      serviceHours: ['周一至周五 14:00–18:00'],
    },
    { Authorization: `Bearer ${newLogin.token}`, 'X-Active-Role': 'student' },
  );
  results.push(assert('新号注册学生 → pending', reg.status === 200 && reg.data.roles?.some(
    (r) => r.role === 'student' && r.status === 'pending',
  )));
  const newProfile = await json('GET', '/api/nuanban/student/profile', null, {
    Authorization: `Bearer ${newLogin.token}`,
    'X-Active-Role': 'student',
  });
  results.push(assert(
    '新号资料含联系手机/区域/时段',
    newProfile.data.contactPhone === newPhone
      && Array.isArray(newProfile.data.serviceAreaPolygons)
      && newProfile.data.serviceAreaPolygons.length > 0
      && Array.isArray(newProfile.data.serviceHours)
      && newProfile.data.serviceHours.length > 0,
  ));
  const newWithdrawal = await json('GET', '/api/nuanban/student/withdrawal', null, {
    Authorization: `Bearer ${newLogin.token}`,
    'X-Active-Role': 'student',
  });
  results.push(assert(
    '新号可提现余额为 0',
    newWithdrawal.status === 200 && newWithdrawal.data.availableCents === 0,
    `status=${newWithdrawal.status} available=${newWithdrawal.data?.availableCents}`,
  ));

  // Print
  console.log('\n=== 学生审核 API 自动化测试 ===\n');
  let pass = 0;
  let fail = 0;
  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
    if (r.ok) pass += 1;
    else fail += 1;
  }
  console.log(`\n合计: ${pass} 通过, ${fail} 失败\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

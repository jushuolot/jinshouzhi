#!/usr/bin/env node
/**
 * 产品冒烟：老人 / 家属 / 运营 / 语音通话 API
 * 用法: node scripts/test-product-smoke.mjs
 */
const BASE = process.env.NUANBAN_API || 'http://127.0.0.1:8090';

const TOPIC_POOLS = {
  动物: ['🐱', '🐶', '🐰', '🐻', '🦁', '🐼', '🐮', '🐷'],
  水果: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍑', '🍊', '🥝'],
  交通工具: ['🚗', '🚌', '✈️', '🚲', '🚢', '🚆', '🛵', '🚕'],
  食物: ['🍜', '🍚', '🥟', '🍞', '🥗', '🍕', '🌮', '🍲'],
};

const PHONES = {
  student: '13500000001',
  family: '13800000004',
  elder: '13500000005',
};

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
  const selectedIds = challenge.tiles.filter((t) => pool.includes(t.emoji)).map((t) => t.id);
  if (!selectedIds.length) throw new Error('no captcha tiles matched topic');
  return selectedIds;
}

async function phoneLogin(phone) {
  const ch = await json('GET', '/api/nuanban/captcha/challenge');
  if (ch.status !== 200) throw new Error(`captcha ${ch.status}`);
  const ver = await json('POST', '/api/nuanban/captcha/verify', {
    challengeId: ch.data.challengeId,
    selectedIds: solveCaptcha(ch.data),
  });
  if (ver.status !== 200 || !ver.data.captchaToken) throw new Error('captcha verify failed');
  const sms = await json('POST', '/api/nuanban/sms/send', {
    phone,
    captchaToken: ver.data.captchaToken,
  });
  if (sms.status !== 200) throw new Error(`sms send ${sms.status}`);
  let code = sms.data.devCode;
  if (!code && sms.data.deliveryId) {
    const recv = await json(
      'GET',
      `/api/nuanban/sms/receive?phone=${encodeURIComponent(phone)}&deliveryId=${encodeURIComponent(sms.data.deliveryId)}`,
    );
    if (recv.data?.ready && recv.data?.code) code = recv.data.code;
  }
  if (!code) {
    const outbox = await json('GET', '/api/nuanban/platform/sms-outbox?key=nuanban2026');
    code = outbox.data?.list?.find((r) => r.phone === phone)?.code;
  }
  if (!code) throw new Error('no sms code');
  const login = await json('POST', '/api/nuanban/phone-login', { phone, code });
  if (login.status !== 200 || !login.data.token) throw new Error(`login ${phone} failed`);
  return login.data;
}

function assert(name, ok, detail = '') {
  return { name, ok, detail };
}

function hdr(token, role) {
  return { Authorization: `Bearer ${token}`, 'X-Active-Role': role };
}

async function main() {
  const results = [];

  // —— 老人 ——
  const elderLogin = await phoneLogin(PHONES.elder);
  results.push(assert('老人登录', !!elderLogin.token));

  const elderProfile = await json('GET', '/api/nuanban/elder/profile', null, hdr(elderLogin.token, 'elder'));
  results.push(assert('老人 GET 资料', elderProfile.status === 200));
  results.push(assert(
    '老人资料含 orgProfileComplete',
    typeof elderProfile.data?.orgProfileComplete === 'boolean',
  ));
  results.push(assert(
    '老人资料绑定自己的档案（非错绑）',
    !!elderProfile.data?.id && elderProfile.data.name?.length > 0,
    elderProfile.data?.name,
  ));

  const caregivers = await json(
    'GET',
    '/api/nuanban/elder/caregivers/nearby?lat=31.23&lng=121.47',
    null,
    hdr(elderLogin.token, 'elder'),
  );
  results.push(assert('老人附近陪护列表', caregivers.status === 200 && Array.isArray(caregivers.data?.list)));
  results.push(assert(
    '陪护列表默认返回全部可接单学生',
    (caregivers.data?.total ?? 0) >= 2,
    `total=${caregivers.data?.total}`,
  ));

  const svcItems = await json(
    'GET',
    '/api/collections/service_items/records?filter=enabled=true&perPage=1',
    null,
    hdr(elderLogin.token, 'elder'),
  );
  const svcId = svcItems.data?.items?.[0]?.id;
  const caregiver0 = caregivers.data?.list?.[0];
  if (svcId && caregiver0?.id && elderProfile.data?.id) {
    const book = await json(
      'POST',
      '/api/nuanban/elder/orders',
      {
        elderId: elderProfile.data.id,
        serviceItemId: svcId,
        studentId: caregiver0.id,
        scheduledAt: new Date().toISOString(),
      },
      hdr(elderLogin.token, 'elder'),
    );
    results.push(assert(
      '老人预约指定同学',
      book.status === 200 && !!book.data?.id,
      `status=${book.status} ${book.data?.message || ''}`,
    ));
  } else {
    results.push(assert('老人预约指定同学', false, '缺少服务项或陪护同学'));
  }

  const elderWallet = await json('GET', '/api/nuanban/elder/wallet', null, hdr(elderLogin.token, 'elder'));
  results.push(assert('老人储值卡', elderWallet.status === 200));

  const elderStats = await json('GET', '/api/nuanban/elder/stats', null, hdr(elderLogin.token, 'elder'));
  results.push(assert('老人统计', elderStats.status === 200));

  // —— 家属 ——
  const familyLogin = await phoneLogin(PHONES.family);
  results.push(assert('家属登录', !!familyLogin.token));

  const familyProfile = await json('GET', '/api/nuanban/family/profile', null, hdr(familyLogin.token, 'family'));
  results.push(assert('家属 GET 资料', familyProfile.status === 200));
  results.push(assert(
    '家属绑定老人信息',
    !!familyProfile.data?.linkedElderName,
    familyProfile.data?.linkedElderName,
  ));

  const familyWallet = await json('GET', '/api/nuanban/family/wallet', null, hdr(familyLogin.token, 'family'));
  results.push(assert('家属储值卡', familyWallet.status === 200));

  const familyStats = await json('GET', '/api/nuanban/family/stats', null, hdr(familyLogin.token, 'family'));
  results.push(assert('家属统计', familyStats.status === 200));

  const familySos = await json('GET', '/api/nuanban/family/sos/active', null, hdr(familyLogin.token, 'family'));
  results.push(assert('家属 SOS 列表', familySos.status === 200));

  // —— 运营 ——
  const overview = await json('GET', '/api/nuanban/platform/overview');
  results.push(assert('运营 KPI overview', overview.status === 200));

  const opsStudents = await json('GET', '/api/nuanban/platform/students?page=1&pageSize=10');
  results.push(assert('运营学生列表', opsStudents.status === 200 && Array.isArray(opsStudents.data?.list)));

  const opsElders = await json('GET', '/api/nuanban/platform/elders?page=1&pageSize=20');
  results.push(assert('运营老人档案列表', opsElders.status === 200 && Array.isArray(opsElders.data?.list)));

  const opsOrgs = await json('GET', '/api/nuanban/platform/organizations');
  results.push(assert('运营机构列表', opsOrgs.status === 200 && Array.isArray(opsOrgs.data?.list)));

  if (opsElders.data?.list?.length) {
    const target = opsElders.data.list[0];
    const patch = await json(
      'PATCH',
      `/api/nuanban/platform/elders/${target.id}`,
      {
        name: target.name || '张奶奶',
        orgName: target.orgName || '暖伴示范养老院',
        district: target.district || '浦东新区',
        healthStatus: target.healthStatus || '总体良好',
        mobility: target.mobility || '行动便利',
        livingSituation: target.livingSituation || '与子女同住',
      },
    );
    results.push(assert('运营 PATCH 老人机构档案', patch.status === 200 && patch.data?.elder?.id === target.id));

    if (target.loginPhone || target.phone) {
      const phoneQ = (target.loginPhone || target.phone).slice(-4);
      const byPhone = await json('GET', `/api/nuanban/platform/elders?page=1&pageSize=10&q=${phoneQ}`);
      const found = byPhone.data?.list?.some((e) => e.id === target.id);
      results.push(assert('运营按手机号搜索老人', byPhone.status === 200 && found, phoneQ));
    } else {
      results.push(assert('运营按手机号搜索老人', true, '无绑定手机，跳过'));
    }
  } else {
    results.push(assert('运营 PATCH 老人机构档案', false, '无老人记录'));
  }

  const dispatch = await json('GET', '/api/nuanban/org/orders/dispatchable');
  results.push(assert('运营派单池', dispatch.status === 200));

  const funds = await json('GET', '/api/nuanban/platform/funds/overview');
  results.push(assert('运营资金概览', funds.status === 200));

  // —— 语音通话（学生 + 服务中订单）——
  const studentLogin = await phoneLogin(PHONES.student);
  results.push(assert('学生登录（语音测）', !!studentLogin.token));

  const activeOrders = await json(
    'GET',
    '/api/nuanban/student/orders/active',
    null,
    hdr(studentLogin.token, 'student'),
  );
  results.push(assert('学生进行中订单列表', activeOrders.status === 200));

  let callOrderId = null;
  const list = activeOrders.data?.list || [];
  const callOrder =
    list.find((o) => o.status === 'in_service')
    || list.find((o) => o.status === 'pending_service')
    || list[0];
  if (callOrder?.id) callOrderId = callOrder.id;

  if (!callOrderId) {
    const allOrders = await json('GET', '/api/nuanban/student/orders/pending', null, hdr(studentLogin.token, 'student'));
    callOrderId =
      allOrders.data?.list?.find((o) => o.status === 'in_service')?.id
      || allOrders.data?.list?.find((o) => o.status === 'pending_service')?.id;
  }

  if (callOrderId) {
    const callGet = await json(
      'GET',
      `/api/nuanban/orders/${callOrderId}/call`,
      null,
      hdr(studentLogin.token, 'student'),
    );
    results.push(assert(
      '学生 GET 语音通话信息',
      callGet.status === 200 && callGet.data?.callOpen === true && !!callGet.data?.maskedNumber,
      callGet.data?.peerAlias,
    ));

    const callPost = await json(
      'POST',
      `/api/nuanban/orders/${callOrderId}/call`,
      {},
      hdr(studentLogin.token, 'student'),
    );
    results.push(assert(
      '学生 POST 发起语音通话',
      callPost.status === 200 && callPost.data?.callOpen === true && !!callPost.data?.callId,
    ));
    results.push(assert(
      'POST 通话返回 WebRTC 字段',
      callPost.data?.mode === 'webrtc'
        && !!callPost.data?.roomId
        && Array.isArray(callPost.data?.iceServers)
        && !!callPost.data?.clientId,
      `room=${callPost.data?.roomId}`,
    ));

    const studentClientId = callPost.data?.clientId || 'cid_test_student';
    const familyCallPost = await json(
      'POST',
      `/api/nuanban/orders/${callOrderId}/call`,
      {},
      hdr(familyLogin.token, 'family'),
    );
    const familyClientId = familyCallPost.data?.clientId || 'cid_test_family';

    const joinStudent = await json(
      'POST',
      `/api/nuanban/orders/${callOrderId}/call/signal`,
      { type: 'join', clientId: studentClientId },
      hdr(studentLogin.token, 'student'),
    );
    results.push(assert(
      '学生 POST 信令 join',
      joinStudent.status === 200 && joinStudent.data?.signal?.type === 'join',
    ));

    const joinFamily = await json(
      'POST',
      `/api/nuanban/orders/${callOrderId}/call/signal`,
      { type: 'join', clientId: familyClientId },
      hdr(familyLogin.token, 'family'),
    );
    results.push(assert(
      '家属 POST 信令 join',
      joinFamily.status === 200 && joinFamily.data?.signal?.type === 'join',
    ));

    const pollStudent = await json(
      'GET',
      `/api/nuanban/orders/${callOrderId}/call/signal?clientId=${encodeURIComponent(studentClientId)}&since=0`,
      null,
      hdr(studentLogin.token, 'student'),
    );
    const studentSeesFamily = (pollStudent.data?.signals || []).some(
      (s) => s.type === 'join' && s.clientId === familyClientId,
    );
    results.push(assert(
      '学生轮询收到家属 join',
      pollStudent.status === 200 && studentSeesFamily,
      `signals=${(pollStudent.data?.signals || []).length}`,
    ));

    const pollFamily = await json(
      'GET',
      `/api/nuanban/orders/${callOrderId}/call/signal?clientId=${encodeURIComponent(familyClientId)}&since=0`,
      null,
      hdr(familyLogin.token, 'family'),
    );
    const familySeesStudent = (pollFamily.data?.signals || []).some(
      (s) => s.type === 'join' && s.clientId === studentClientId,
    );
    results.push(assert(
      '家属轮询收到学生 join',
      pollFamily.status === 200 && familySeesStudent,
    ));

    const elderCall = await json(
      'POST',
      `/api/nuanban/orders/${callOrderId}/call`,
      {},
      hdr(elderLogin.token, 'elder'),
    );
    results.push(assert(
      '老人 POST 发起语音通话',
      elderCall.status === 200 && elderCall.data?.callOpen === true,
      elderCall.data?.peerAlias,
    ));

    const familyCall = await json(
      'GET',
      `/api/nuanban/orders/${callOrderId}/call`,
      null,
      hdr(familyLogin.token, 'family'),
    );
    results.push(assert(
      '家属 GET 语音通话（代付关联）',
      familyCall.status === 200,
      `status=${familyCall.status}`,
    ));

    // 聊天语音消息（模拟 1 秒）
    const fakeAudio = Buffer.from('fake-audio-demo').toString('base64');
    const voiceMsg = await json(
      'POST',
      `/api/nuanban/orders/${callOrderId}/messages`,
      { type: 'voice', audioBase64: fakeAudio, durationSec: 3, mimeType: 'audio/mpeg' },
      hdr(studentLogin.token, 'student'),
    );
    results.push(assert(
      '学生发送聊天语音消息',
      voiceMsg.status === 200 && voiceMsg.data?.message?.type === 'voice',
    ));

    const callBlocked = await json(
      'GET',
      '/api/nuanban/orders/nonexistent-order/call',
      null,
      hdr(studentLogin.token, 'student'),
    );
    results.push(assert('无效订单通话 → 404', callBlocked.status === 404));
  } else {
    results.push(assert('语音通话：存在可通话订单', false, '请确保有待服务/服务中订单'));
    results.push(assert('学生 GET 语音通话信息', false, '跳过'));
    results.push(assert('学生 POST 发起语音通话', false, '跳过'));
    results.push(assert('POST 通话返回 WebRTC 字段', false, '跳过'));
    results.push(assert('学生 POST 信令 join', false, '跳过'));
    results.push(assert('家属 POST 信令 join', false, '跳过'));
    results.push(assert('学生轮询收到家属 join', false, '跳过'));
    results.push(assert('家属轮询收到学生 join', false, '跳过'));
    results.push(assert('老人 POST 发起语音通话', false, '跳过'));
    results.push(assert('家属 GET 语音通话（代付关联）', false, '跳过'));
    results.push(assert('学生发送聊天语音消息', false, '跳过'));
    results.push(assert('无效订单通话 → 404', false, '跳过'));
  }

  // 非服务中不可拨打
  const pendingPay = await json('GET', '/api/nuanban/family/orders/pending-payment', null, hdr(familyLogin.token, 'family'));
  const pendingOrder = pendingPay.data?.list?.[0];
  if (pendingOrder?.id) {
    const blocked = await json(
      'POST',
      `/api/nuanban/orders/${pendingOrder.id}/call`,
      {},
      hdr(familyLogin.token, 'family'),
    );
    results.push(assert(
      '待支付订单不可语音通话',
      blocked.status === 400 && String(blocked.data?.message || '').includes('服务进行中'),
    ));
  } else {
    results.push(assert('待支付订单不可语音通话', true, '无待支付单，逻辑由单元测试覆盖'));
  }

  console.log('\n=== 产品冒烟测试（老人·家属·运营·语音）===\n');
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

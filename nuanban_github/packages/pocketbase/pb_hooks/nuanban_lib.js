/// Shared helpers for nuanban.pb.js (require inside each route handler)
/** 与 packages/miniapp/src/utils/known-schools.ts 保持同步 */
var KNOWN_SCHOOLS = [
  "示范大学", "城东师范学院", "医科大学", "复旦大学", "上海交通大学", "同济大学",
  "华东师范大学", "上海大学", "南京大学", "东南大学", "浙江大学", "中国科学技术大学",
  "北京大学", "清华大学", "中国人民大学", "北京师范大学", "武汉大学", "华中科技大学",
  "中山大学", "华南理工大学", "四川大学", "电子科技大学", "西安交通大学", "哈尔滨工业大学",
  "吉林大学", "厦门大学", "山东大学", "中南大学", "湖南大学", "重庆大学",
];

function isKnownSchool(name) {
  var t = String(name || "").trim();
  if (!t) return false;
  for (var i = 0; i < KNOWN_SCHOOLS.length; i++) {
    if (KNOWN_SCHOOLS[i] === t) return true;
  }
  return false;
}

function findOrCreateSchoolByName(name) {
  var schools = $app.findRecordsByFilter(
    "school_dict",
    "name = {:n}",
    "",
    1,
    0,
    { n: name }
  );
  if (schools.length > 0) return schools[0];
  var schoolCol = $app.findCollectionByNameOrId("school_dict");
  var rec = new Record(schoolCol);
  rec.set("name", name);
  rec.set("enabled", true);
  rec.set("sort_order", 99);
  $app.save(rec);
  return rec;
}

function elderNameById(id) {
  try {
    return $app.findRecordById("elders", id).getString("name");
  } catch (_) {
    return "老人";
  }
}

function safeRecordString(rec, field, fallback) {
  try {
    const v = rec.getString(field);
    return v != null && v !== "" ? v : fallback || "";
  } catch (_) {
    return fallback || "";
  }
}

function safeRecordInt(rec, field, fallback) {
  try {
    const v = rec.getInt(field);
    if (v != null && !isNaN(v)) return v;
  } catch (_) {}
  try {
    const v = parseInt(rec.getString(field), 10);
    if (!isNaN(v)) return v;
  } catch (_) {}
  return fallback != null ? fallback : 0;
}

function safeRecordBool(rec, field, fallback) {
  try {
    return !!rec.getBool(field);
  } catch (_) {}
  try {
    const v = rec.get(field);
    return v === true || v === 1 || v === "true";
  } catch (_) {}
  return !!fallback;
}

function safeRecordFloat(rec, field, fallback) {
  try {
    const v = rec.getFloat(field);
    if (v != null && !isNaN(v)) return v;
  } catch (_) {}
  try {
    const v = parseFloat(rec.getString(field));
    if (!isNaN(v)) return v;
  } catch (_) {}
  return fallback != null ? fallback : 0;
}

function serviceInfoById(id) {
  try {
    const s = $app.findRecordById("service_items", id);
    return {
      name: safeRecordString(s, "name", "陪护服务"),
      durationMinutes: safeRecordInt(s, "duration_minutes", 0),
      requiresOutdoor: safeRecordBool(s, "requires_outdoor_approval", false),
    };
  } catch (_) {
    return { name: "陪护服务", durationMinutes: 0, requiresOutdoor: false };
  }
}

var ORDER_TIMELINE_MEM = {};
var ORDER_MESSAGES_MEM = {};

function readOrderTimeline(order) {
  var list = null;
  try {
    var raw = order.get("status_timeline");
    if (raw) {
      if (typeof raw === "string") list = JSON.parse(raw);
      else if (Array.isArray(raw)) list = raw;
    }
  } catch (_) {}
  if ((!list || !list.length) && ORDER_TIMELINE_MEM[order.id]) {
    list = ORDER_TIMELINE_MEM[order.id];
  }
  if (list && list.length) return list;
  return backfillOrderTimeline(order);
}

function backfillOrderTimeline(order) {
  var status = safeRecordString(order, "status", "");
  var created = safeRecordString(order, "created", new Date().toISOString());
  var chain = ["pending_payment", "pending_accept", "pending_service", "in_service", "pending_confirm", "completed"];
  var idx = chain.indexOf(status);
  if (status === "outdoor_pending") idx = 1;
  var events = [{ key: "created", at: created, detail: "订单已创建", actor: "system" }];
  var labels = {
    pending_payment: "等待支付",
    pending_accept: "等待同学接单",
    outdoor_pending: "外出陪同待家属审批",
    pending_service: "同学已接单，等待到场",
    in_service: "服务进行中",
    pending_confirm: "服务已结束，等待确认",
    completed: "订单已完成",
  };
  for (var i = 0; i <= idx && i < chain.length; i++) {
    var k = chain[i];
    if (status === "outdoor_pending" && k === "pending_accept") continue;
    events.push({ key: k, at: created, detail: labels[k] || k, actor: "system" });
  }
  if (status === "outdoor_pending") {
    events.push({ key: "outdoor_pending", at: created, detail: labels.outdoor_pending, actor: "system" });
  }
  return events;
}

function saveOrderTimeline(order, list) {
  try {
    order.set("status_timeline", list);
  } catch (_) {
    ORDER_TIMELINE_MEM[order.id] = list;
  }
}

function appendOrderTimeline(order, key, detail, actor) {
  var list = readOrderTimeline(order);
  list.push({
    key: key,
    at: new Date().toISOString(),
    detail: detail || "",
    actor: actor || "system",
  });
  saveOrderTimeline(order, list);
  return list;
}

function orderToStudentDto(o) {
  const svc = serviceInfoById(safeRecordString(o, "service_item", ""));
  return {
    id: o.id,
    elderId: safeRecordString(o, "elder", ""),
    elderName: elderNameById(safeRecordString(o, "elder", "")),
    serviceName: svc.name,
    durationMinutes: svc.durationMinutes,
    amountCents: safeRecordInt(o, "amount_cents", 0),
    scheduledAt: safeRecordString(o, "scheduled_at", ""),
    status: safeRecordString(o, "status", ""),
    requiresOutdoorApproval: svc.requiresOutdoor,
    timeline: readOrderTimeline(o),
    chatOpen: orderChatThreadOpen(safeRecordString(o, "status", "")),
  };
}

function sosToDto(rec) {
  return {
    id: rec.id,
    elderId: rec.getString("elder"),
    elderName: elderNameById(rec.getString("elder")),
    message: rec.getString("message") || "老人发起一键求助",
    createdAt: rec.getString("created"),
    status: rec.getString("status"),
  };
}

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function orderToFamilyDto(order) {
  const svc = serviceInfoById(order.getString("service_item"));
  let studentName;
  try {
    const su = order.getString("student_user");
    if (su) {
      const u = $app.findRecordById("users", su);
      studentName = u.getString("name") || u.getString("nickname") || "陪护同学";
    }
  } catch (_) {}
  return {
    id: order.id,
    status: order.getString("status"),
    amount_cents: order.getInt("amount_cents"),
    scheduled_at: order.getString("scheduled_at"),
    payment_status: order.getString("payment_status"),
    elderName: elderNameById(order.getString("elder")),
    serviceName: svc.name,
    studentName: studentName,
    requiresOutdoorApproval: svc.requiresOutdoor,
    timeline: readOrderTimeline(order),
    chatOpen: orderChatThreadOpen(order.getString("status")),
  };
}

function orderToElderDto(order) {
  const svc = serviceInfoById(order.getString("service_item"));
  let studentName;
  try {
    const su = order.getString("student_user");
    if (su) {
      const u = $app.findRecordById("users", su);
      studentName = u.getString("name") || u.getString("nickname") || "陪护同学";
    }
  } catch (_) {}
  return {
    id: order.id,
    status: order.getString("status"),
    amount_cents: order.getInt("amount_cents"),
    scheduled_at: order.getString("scheduled_at"),
    payment_status: order.getString("payment_status"),
    serviceName: svc.name,
    studentName: studentName,
    requiresOutdoorApproval: svc.requiresOutdoor,
    timeline: readOrderTimeline(order),
    chatOpen: orderChatThreadOpen(order.getString("status")),
  };
}

function orderChatThreadOpen(status) {
  return (
    status === "pending_accept" ||
    status === "pending_service" ||
    status === "in_service" ||
    status === "pending_confirm"
  );
}

function orderChatAlias(userId, role) {
  if (role === "student") {
    var sr = $app.findRecordsByFilter(
      "user_roles",
      'user = {:u} && role = "student"',
      "",
      1,
      0,
      { u: userId }
    );
    var dn = sr.length ? safeRecordString(sr[0], "display_name", "同学") : "同学";
    return "陪护同学·" + (dn.charAt(0) || "同");
  }
  if (role === "family") return "家属·联系人";
  if (role === "elder") return "老人·本人";
  return "用户";
}

function orderChatCanAccess(userId, role, order) {
  if (role === "student" && order.getString("student_user") === userId) return true;
  if (role === "elder") {
    var eid = elderProfileIdForUser(userId);
    return eid && order.getString("elder") === eid;
  }
  if (role === "family" && familyCanAccessOrder(userId, order)) return true;
  return false;
}

function orderMessagesList(orderId) {
  if (!ORDER_MESSAGES_MEM[orderId]) ORDER_MESSAGES_MEM[orderId] = [];
  return ORDER_MESSAGES_MEM[orderId];
}

function orderMessageToDto(orderId, m, viewerId) {
  var dto = {
    id: m.id,
    orderId: orderId,
    senderRole: m.senderRole,
    senderAlias: m.senderAlias,
    type: m.type || "text",
    body: m.body || "",
    createdAt: m.createdAt,
    mine: m.senderUser === viewerId,
  };
  if (m.type === "voice") {
    dto.durationSec = m.durationSec || 1;
    if (m.audioBase64) {
      var mime = m.mimeType || "audio/mpeg";
      dto.audioUrl = "data:" + mime + ";base64," + m.audioBase64;
    }
    dto.body = "[语音 " + dto.durationSec + "秒]";
  }
  return dto;
}

function orderMessagesDto(orderId, viewerId) {
  var list = orderMessagesList(orderId);
  var out = [];
  for (var i = 0; i < list.length; i++) {
    out.push(orderMessageToDto(orderId, list[i], viewerId));
  }
  return out;
}

function orderMessagePushText(orderId, senderUser, senderRole, body) {
  var list = orderMessagesList(orderId);
  var msg = {
    id: "msg_" + orderId + "_" + (list.length + 1),
    senderUser: senderUser,
    senderRole: senderRole,
    senderAlias: orderChatAlias(senderUser, senderRole),
    type: "text",
    body: String(body || "").slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  list.push(msg);
  return msg;
}

function orderMessagePushVoice(orderId, senderUser, senderRole, audioBase64, durationSec, mimeType) {
  var list = orderMessagesList(orderId);
  var sec = Math.max(1, Math.min(60, parseInt(String(durationSec), 10) || 1));
  var b64 = String(audioBase64 || "");
  if (b64.length > 400000) {
    throw new Error("语音过大，请缩短录音后重试");
  }
  var msg = {
    id: "msg_" + orderId + "_" + (list.length + 1),
    senderUser: senderUser,
    senderRole: senderRole,
    senderAlias: orderChatAlias(senderUser, senderRole),
    type: "voice",
    body: "",
    audioBase64: b64,
    mimeType: mimeType || "audio/mpeg",
    durationSec: sec,
    createdAt: new Date().toISOString(),
  };
  list.push(msg);
  return msg;
}

function elderProfileIdForUser(userId) {
  const roles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "elder"',
    "",
    1,
    0,
    { uid: userId }
  );
  if (roles.length === 0) return null;
  try {
    return roles[0].getString("elder_profile") || null;
  } catch (_) {
    return null;
  }
}

function familyCanAccessOrder(userId, order) {
  try {
    if (order.getString("family_user") === userId) return true;
  } catch (_) {}
  const elderId = order.getString("elder");
  const bindings = $app.findRecordsByFilter(
    "family_elder_bindings",
    "family_user = {:uid} && elder = {:eid}",
    "",
    1,
    0,
    { uid: userId, eid: elderId }
  );
  return bindings.length > 0;
}

function completeOrderSchedule(orderId, scheduleStatus) {
  const schs = $app.findRecordsByFilter(
    "schedules",
    "order = {:oid}",
    "",
    1,
    0,
    { oid: orderId }
  );
  if (schs.length > 0) {
    schs[0].set("status", scheduleStatus);
    $app.save(schs[0]);
  }
}

function finalizeOrderAfterConfirm(order) {
  if (order.getString("payment_status") === "unpaid") {
    order.set("payment_status", "paid");
    order.set("paid_at", new Date().toISOString());
    appendOrderTimeline(order, "pending_payment", "家属/老人已付款", "family");
  }
  appendOrderTimeline(order, "completed", "已确认完成，收入将计入结算", "family");
  order.set("status", "completed");
  $app.save(order);
  completeOrderSchedule(order.id, "completed");
}

/** 演示储值卡（进程内，按 userId 隔离；用 function 属性避免 hooks 路由作用域问题） */
function walletDemoStoreMap() {
  if (!walletDemoStoreMap._data) walletDemoStoreMap._data = {};
  return walletDemoStoreMap._data;
}

function walletEnsureUser(userId) {
  const store = walletDemoStoreMap();
  if (!store[userId]) {
    store[userId] = { balanceCents: 0, transactions: [] };
  }
  return store[userId];
}

function walletOverviewDto(owner) {
  var txs = owner.transactions || [];
  return {
    balanceCents: owner.balanceCents || 0,
    balanceYuan: ((owner.balanceCents || 0) / 100).toFixed(2),
    transactions: txs.slice(0, 10),
  };
}

function walletTopup(userId, amountCents) {
  if (!amountCents || amountCents < 100) {
    return { ok: false, message: "充值金额至少 ¥1.00" };
  }
  var owner = walletEnsureUser(userId);
  owner.balanceCents = (owner.balanceCents || 0) + amountCents;
  owner.transactions = owner.transactions || [];
  owner.transactions.unshift({
    id: "wt-topup-" + Date.now(),
    type: "topup",
    amountCents: amountCents,
    label: "储值卡充值",
    createdAt: new Date().toISOString(),
  });
  if (owner.transactions.length > 50) owner.transactions.length = 50;
  return { ok: true, overview: walletOverviewDto(owner) };
}

function walletPayLabel(order) {
  var svc = serviceInfoById(order.getString("service_item"));
  return svc.name + " · " + elderNameById(order.getString("elder"));
}

function walletDeductForOrder(userId, order) {
  var amountCents = order.getInt("amount_cents");
  if (!amountCents || amountCents <= 0) {
    return { ok: false, message: "订单金额无效" };
  }
  var owner = walletEnsureUser(userId);
  if ((owner.balanceCents || 0) < amountCents) {
    return { ok: false, message: "储值余额不足，请先充值" };
  }
  owner.balanceCents -= amountCents;
  owner.transactions = owner.transactions || [];
  owner.transactions.unshift({
    id: "wt-pay-" + Date.now(),
    type: "pay",
    amountCents: amountCents,
    label: walletPayLabel(order),
    createdAt: new Date().toISOString(),
    orderId: order.id,
  });
  if (owner.transactions.length > 50) owner.transactions.length = 50;
  return { ok: true, overview: walletOverviewDto(owner) };
}

function walletPayOrderRecord(userId, order) {
  if (order.getString("payment_status") === "paid") {
    return { ok: false, message: "订单已支付" };
  }
  var status = order.getString("status");
  var payable =
    status === "pending_payment" ||
    (status === "pending_confirm" && order.getString("payment_status") === "unpaid");
  if (!payable) return { ok: false, message: "当前订单状态不可支付" };
  var deduct = walletDeductForOrder(userId, order);
  if (!deduct.ok) return deduct;
  order.set("payment_status", "paid");
  order.set("paid_at", new Date().toISOString());
  if (status === "pending_payment") order.set("status", "pending_accept");
  $app.save(order);
  return { ok: true, status: order.getString("status"), overview: deduct.overview };
}

/** X-Active-Role 演示校验：header 与 token 用户角色不一致时 403 */
function userHasRole(userId, role) {
  const roles = $app.findRecordsByFilter(
    "user_roles",
    "user = {:uid} && role = {:role}",
    "",
    1,
    0,
    { uid: userId, role: role }
  );
  if (roles.length === 0) return false;
  return roles[0].getString("status") === "active" || roles[0].getString("status") === "pending";
}

function assertActiveRoleHeader(e, expectedRole) {
  if (!e.auth) return { ok: false, code: 401, body: { message: "需要登录" } };
  let headerRole = "";
  try {
    headerRole = e.request.header.get("X-Active-Role") || "";
  } catch (_) {}
  if (!headerRole) return { ok: true };
  if (headerRole !== expectedRole) {
    return { ok: false, code: 403, body: { message: "当前身份无权访问" } };
  }
  if (!userHasRole(e.auth.id, headerRole)) {
    return { ok: false, code: 403, body: { message: "身份不匹配" } };
  }
  return { ok: true };
}


function studentWithdrawalsMap() {
  if (!studentWithdrawalsMap._data) studentWithdrawalsMap._data = {};
  return studentWithdrawalsMap._data;
}

function demoStudentSettlements() {
  return [
    { id: "stl-2025-04", period: "2025-04", amountCents: 24800, status: "paid", paidAt: "2025-05-05" },
    { id: "stl-2025-05", period: "2025-05", amountCents: 28500, status: "paid", paidAt: "2025-06-01" },
    { id: "stl-2025-06", period: "2025-06", amountCents: 35200, status: "pending" },
  ];
}

function studentWithdrawalBalances(settlements, withdrawals) {
  var paidTotal = 0;
  var frozenCents = 0;
  for (var i = 0; i < settlements.length; i++) {
    var s = settlements[i];
    if (s.status === "paid") paidTotal += s.amountCents;
    if (s.status === "pending") frozenCents += s.amountCents;
  }
  var withdrawnTotal = 0;
  for (var j = 0; j < withdrawals.length; j++) {
    if (withdrawals[j].status === "rejected") continue;
    withdrawnTotal += withdrawals[j].amountCents;
  }
  var availableCents = paidTotal - withdrawnTotal;
  if (availableCents < 0) availableCents = 0;
  return { availableCents: availableCents, frozenCents: frozenCents };
}

function requestBearerToken(e) {
  try {
    var h = e.request.header.get("Authorization") || "";
    if (h.indexOf("Bearer ") === 0) return h.substring(7);
  } catch (_) {}
  return "";
}

function requestOrigin(e) {
  try {
    var proto = "";
    var host = "";
    try {
      proto = e.request.header.get("X-Forwarded-Proto") || "";
    } catch (_) {}
    try {
      host = e.request.header.get("X-Forwarded-Host") || e.request.host || "";
    } catch (_) {}
    if (!proto) {
      try {
        proto = e.request.scheme || "";
      } catch (_) {}
    }
    if (!proto) proto = "http";
    if (!host) return "";
    return proto + "://" + host;
  } catch (_) {}
  return "";
}

var GITHUB_DEMO_BASE = "https://jushuolot.github.io/jinshouzhi/nuanban";

/** H5 站点根（邀请链接、运营看板 demoUrl）；线上用请求来源，本地回退 GitHub 测试版 */
function h5AppBaseUrl(e) {
  var origin = requestOrigin(e);
  if (origin) {
    var host = "";
    try {
      host = origin.split("://")[1] || "";
    } catch (_) {}
    if (host.indexOf("localhost") === -1 && host.indexOf("127.0.0.1") === -1) {
      return origin.replace(/\/$/, "");
    }
  }
  return GITHUB_DEMO_BASE;
}

/** PocketBase users.avatar 文件对外 URL（含 token 以便 H5 img 加载） */
function userAvatarUrlForClient(auth, e) {
  var fn = safeRecordString(auth, "avatar", "");
  if (!fn) return "";
  var origin = requestOrigin(e);
  if (!origin) return "";
  var tok = requestBearerToken(e);
  var q = tok ? "?token=" + encodeURIComponent(tok) : "";
  return origin + "/api/files/users/" + auth.id + "/" + fn + q;
}

function userAvatarFields(auth, e) {
  var fn = safeRecordString(auth, "avatar", "");
  return {
    avatar: fn,
    avatarUrl: userAvatarUrlForClient(auth, e),
  };
}

function roleFileUrlForClient(record, fieldName, e) {
  var fn = safeRecordString(record, fieldName, "");
  if (!fn) return "";
  var origin = requestOrigin(e);
  if (!origin) return "";
  var tok = requestBearerToken(e);
  var q = tok ? "?token=" + encodeURIComponent(tok) : "";
  return origin + "/api/files/user_roles/" + record.id + "/" + fn + q;
}

function studentRoleRecord(uid) {
  var roles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "student"',
    "",
    1,
    0,
    { uid: uid }
  );
  return roles.length > 0 ? roles[0] : null;
}

function studentWithdrawalOverview(uid) {
  var store = studentWithdrawalsMap();
  var settlements = demoStudentSettlements();
  if (!store[uid]) store[uid] = [];
  var withdrawals = store[uid];
  var bal = studentWithdrawalBalances(settlements, withdrawals);
  return {
    availableCents: bal.availableCents,
    availableYuan: (bal.availableCents / 100).toFixed(2),
    frozenCents: bal.frozenCents,
    frozenYuan: (bal.frozenCents / 100).toFixed(2),
    boundWechat: "微信零钱 · 尾号 8826",
    boundBank: "建设银行 · 尾号 6688",
    withdrawals: withdrawals.slice(0, 20),
  };
}

function adminFundsReconcileMap() {
  if (!adminFundsReconcileMap._data) adminFundsReconcileMap._data = {};
  return adminFundsReconcileMap._data;
}

function adminUserDisplayName(userId) {
  try {
    var u = $app.findRecordById("users", userId);
    var nick = safeRecordString(u, "nickname", "");
    if (nick) return nick;
  } catch (_) {}
  return userId.substring(0, 8);
}

function adminFundCollectWallet() {
  var store = walletDemoStoreMap();
  var topups = [];
  var payments = [];
  var reconcile = adminFundsReconcileMap();
  for (var uid in store) {
    if (!store.hasOwnProperty(uid)) continue;
    var owner = store[uid];
    var txs = owner.transactions || [];
    var userName = adminUserDisplayName(uid);
    for (var i = 0; i < txs.length; i++) {
      var tx = txs[i];
      var base = {
        id: tx.id,
        userId: uid,
        userName: userName,
        amountCents: tx.amountCents,
        label: tx.label,
        createdAt: tx.createdAt,
        reconciled: !!reconcile[tx.id],
      };
      if (tx.type === "topup") {
        base.role = "family";
        topups.push(base);
      } else if (tx.type === "pay") {
        base.role = "family";
        base.orderId = tx.orderId;
        payments.push(base);
      }
    }
  }
  return { topups: topups, payments: payments };
}

function adminFundOverview() {
  var store = walletDemoStoreMap();
  var totalBalanceCents = 0;
  for (var uid in store) {
    if (!store.hasOwnProperty(uid)) continue;
    totalBalanceCents += store[uid].balanceCents || 0;
  }
  var collected = adminFundCollectWallet();
  var topupTotalCents = 0;
  for (var ti = 0; ti < collected.topups.length; ti++) {
    topupTotalCents += collected.topups[ti].amountCents;
  }
  var paymentTotalCents = 0;
  for (var pi = 0; pi < collected.payments.length; pi++) {
    paymentTotalCents += collected.payments[pi].amountCents;
  }
  var wdStore = studentWithdrawalsMap();
  var pendingCount = 0;
  var pendingCents = 0;
  for (var suid in wdStore) {
    if (!wdStore.hasOwnProperty(suid)) continue;
    var list = wdStore[suid];
    for (var wi = 0; wi < list.length; wi++) {
      if (list[wi].status === "pending") {
        pendingCount += 1;
        pendingCents += list[wi].amountCents;
      }
    }
  }
  var unreconciled = 0;
  for (var ui = 0; ui < collected.topups.length; ui++) {
    if (!collected.topups[ui].reconciled) unreconciled += 1;
  }
  for (var uj = 0; uj < collected.payments.length; uj++) {
    if (!collected.payments[uj].reconciled) unreconciled += 1;
  }
  return {
    totalBalanceCents: totalBalanceCents,
    totalBalanceYuan: (totalBalanceCents / 100).toFixed(2),
    topupTotalCents: topupTotalCents,
    topupTotalYuan: (topupTotalCents / 100).toFixed(2),
    paymentTotalCents: paymentTotalCents,
    paymentTotalYuan: (paymentTotalCents / 100).toFixed(2),
    pendingWithdrawalCents: pendingCents,
    pendingWithdrawalYuan: (pendingCents / 100).toFixed(2),
    pendingWithdrawalCount: pendingCount,
    unreconciledCount: unreconciled,
    updatedAt: new Date().toISOString(),
  };
}

function adminFundWithdrawalsList() {
  var wdStore = studentWithdrawalsMap();
  var out = [];
  for (var uid in wdStore) {
    if (!wdStore.hasOwnProperty(uid)) continue;
    var list = wdStore[uid];
    var name = adminUserDisplayName(uid);
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      out.push({
        id: w.id,
        userId: uid,
        studentName: name,
        amountCents: w.amountCents,
        channel: w.channel,
        channelLabel: w.channelLabel,
        status: w.status,
        createdAt: w.createdAt,
        completedAt: w.completedAt,
        rejectReason: w.rejectReason,
      });
    }
  }
  out.sort(function (a, b) {
    return b.createdAt.localeCompare(a.createdAt);
  });
  return out;
}

function adminFindWithdrawal(withdrawalId) {
  var wdStore = studentWithdrawalsMap();
  for (var uid in wdStore) {
    if (!wdStore.hasOwnProperty(uid)) continue;
    var list = wdStore[uid];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === withdrawalId) return { uid: uid, idx: i, list: list };
    }
  }
  return null;
}

function adminApproveWithdrawal(withdrawalId) {
  var found = adminFindWithdrawal(withdrawalId);
  if (!found || found.list[found.idx].status !== "pending") return null;
  var now = new Date().toISOString();
  found.list[found.idx].status = "completed";
  found.list[found.idx].completedAt = now;
  var w = found.list[found.idx];
  return {
    id: w.id,
    userId: found.uid,
    studentName: adminUserDisplayName(found.uid),
    amountCents: w.amountCents,
    channel: w.channel,
    channelLabel: w.channelLabel,
    status: w.status,
    createdAt: w.createdAt,
    completedAt: w.completedAt,
  };
}

function adminRejectWithdrawal(withdrawalId, reason) {
  var found = adminFindWithdrawal(withdrawalId);
  if (!found || found.list[found.idx].status !== "pending") return null;
  found.list[found.idx].status = "rejected";
  found.list[found.idx].rejectReason = reason || "运营驳回";
  var w = found.list[found.idx];
  return {
    id: w.id,
    userId: found.uid,
    studentName: adminUserDisplayName(found.uid),
    amountCents: w.amountCents,
    channel: w.channel,
    channelLabel: w.channelLabel,
    status: w.status,
    createdAt: w.createdAt,
    rejectReason: w.rejectReason,
  };
}

function adminMarkReconciled(recordId) {
  var reconcile = adminFundsReconcileMap();
  reconcile[recordId] = true;
  return { ok: true };
}


module.exports = {
  KNOWN_SCHOOLS, isKnownSchool, findOrCreateSchoolByName,
  elderNameById, safeRecordString, safeRecordInt, safeRecordBool, safeRecordFloat,
  serviceInfoById, orderToStudentDto, sosToDto, haversineM, orderToFamilyDto, orderToElderDto,
  elderProfileIdForUser, familyCanAccessOrder, completeOrderSchedule, finalizeOrderAfterConfirm,
  walletDemoStoreMap, walletEnsureUser, walletOverviewDto, walletTopup, walletPayLabel,
  walletDeductForOrder, walletPayOrderRecord, userHasRole, assertActiveRoleHeader,
  studentWithdrawalsMap, demoStudentSettlements, studentWithdrawalBalances, studentWithdrawalOverview,
  adminFundsReconcileMap, adminFundOverview, adminFundCollectWallet, adminFundWithdrawalsList,
  adminApproveWithdrawal, adminRejectWithdrawal, adminMarkReconciled,
  requestBearerToken, requestOrigin, h5AppBaseUrl, userAvatarUrlForClient, userAvatarFields,
  roleFileUrlForClient, studentRoleRecord,
  readOrderTimeline, appendOrderTimeline, backfillOrderTimeline,
  orderChatThreadOpen, orderChatCanAccess, orderChatAlias,
  orderMessagesDto, orderMessageToDto, orderMessagePushText, orderMessagePushVoice
};

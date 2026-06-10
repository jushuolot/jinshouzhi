/// Shared helpers for nuanban.pb.js (require inside each route handler)
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
  return {
    id: order.id,
    status: order.getString("status"),
    amount_cents: order.getInt("amount_cents"),
    scheduled_at: order.getString("scheduled_at"),
    payment_status: order.getString("payment_status"),
    elderName: elderNameById(order.getString("elder")),
    serviceName: svc.name,
    requiresOutdoorApproval: svc.requiresOutdoor,
  };
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
  }
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
    return e.request.scheme + "://" + e.request.host;
  } catch (_) {}
  return "";
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


module.exports = {
  elderNameById, safeRecordString, safeRecordInt, safeRecordBool, safeRecordFloat,
  serviceInfoById, orderToStudentDto, sosToDto, haversineM, orderToFamilyDto,
  elderProfileIdForUser, familyCanAccessOrder, completeOrderSchedule, finalizeOrderAfterConfirm,
  walletDemoStoreMap, walletEnsureUser, walletOverviewDto, walletTopup, walletPayLabel,
  walletDeductForOrder, walletPayOrderRecord, userHasRole, assertActiveRoleHeader,
  studentWithdrawalsMap, demoStudentSettlements, studentWithdrawalBalances, studentWithdrawalOverview,
  requestBearerToken, requestOrigin, userAvatarUrlForClient, userAvatarFields
};

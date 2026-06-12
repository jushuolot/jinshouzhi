/// V1 custom routes: wx-login stub, order accept/reject, family pay, outdoor approve
/// PB 0.38 每个 routerAdd 回调独立编译；共享逻辑见 nuanban_lib.js，路由内 require 加载。

routerAdd("GET", "/api/nuanban/ping", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  return e.json(200, { ok: true, hooks: true, hasToString: typeof toString });
});

routerAdd("GET", "/api/nuanban/debug/stress", function (e) {
  var q = e.request.url.query();
  var fail = q.get("fail") || "";
  if (fail === "500" || fail === "503") {
    return e.json(parseInt(fail, 10), { message: "stress injected failure" });
  }
  var delayMs = parseInt(q.get("delay") || "0", 10);
  if (delayMs > 0 && delayMs <= 10000) {
    var until = Date.now() + delayMs;
    while (Date.now() < until) {}
  }
  return e.json(200, { ok: true, delayMs: delayMs });
});

routerAdd("POST", "/api/nuanban/body", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const raw = toString(e.request.body);
  const obj = JSON.parse(raw);
  return e.json(200, { obj: obj });
});

routerAdd("GET", "/api/nuanban/debug/roles", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const users = $app.findRecordsByFilter(
    "users",
    "email = {:e}",
    "",
    1,
    0,
    { e: "student1@test.nuanban.dev" }
  );
  if (users.length === 0) return e.json(200, { ok: false, message: "no user" });
  const uid = users[0].id;
  const roles = $app.findRecordsByFilter(
    "user_roles",
    "user = {:uid}",
    "",
    50,
    0,
    { uid: uid }
  );
  return e.json(200, { ok: true, uid: uid, rolesLen: roles.length });
});

routerAdd("POST", "/api/nuanban/wx-login", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const col = $app.findCollectionByNameOrId("users");
  const u = new Record(col);
  const email = "wx_" + String(Date.now()) + "@nuanban.dev";
  u.set("email", email);
  u.setRandomPassword();
  u.set("verified", true);
  u.set("name", "wx");
  $app.saveNoValidate(u);
  return e.json(200, { ok: true, id: u.id, email: email });
});

/** 本地 H5 开发登录：不校验密码，仅按邮箱发 token（须先 seed-demo） */
routerAdd("POST", "/api/nuanban/dev-login", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const email = ((body.email || "student1@test.nuanban.dev") + "").trim();

  const users = $app.findRecordsByFilter("users", "email = {:e}", "", 1, 0, { e: email });
  if (users.length === 0) {
    return e.json(404, { message: "用户不存在，请先执行: ./scripts/seed-demo.sh" });
  }
  const user = users[0];

  const em = (email + "").toLowerCase();
  let activeRole = "student";
  if (em.indexOf("elder") >= 0) {
    activeRole = "elder";
  } else if (em.indexOf("family") >= 0) {
    activeRole = "family";
  }

  const roleRecords = $app.findRecordsByFilter(
    "user_roles",
    "user = {:uid}",
    "",
    50,
    0,
    { uid: user.id }
  );
  const roles = [];
  for (let i = 0; i < roleRecords.length; i++) {
    const r = roleRecords[i];
    let elderProfileId = null;
    try {
      const ep = r.getString("elder_profile");
      if (ep) elderProfileId = ep;
    } catch (_) {}
    roles.push({
      role: r.getString("role") || "student",
      status: r.getString("status") || "active",
      elderProfileId: elderProfileId,
    });
  }
  if (roles.length === 0) {
    roles.push({ role: activeRole, status: "active", elderProfileId: null });
  }

  const activeRoles = roles.filter(function (r) {
    return r.status === "active";
  });
  const resolvedActive =
    activeRoles.length === 1 ? activeRoles[0].role : activeRoles.length > 1 ? null : activeRole;

  var avDev = nb.userAvatarFields(user, e);
  return e.json(200, {
    token: user.newAuthToken(),
    user: {
      id: user.id,
      nickname: user.getString("name") || user.getString("email"),
      email: user.getString("email"),
      avatarUrl: avDev.avatarUrl,
    },
    roles: roles,
    activeRole: resolvedActive,
  });
});

/** 安全验证 · 图画点选 */
routerAdd("GET", "/api/nuanban/captcha/challenge", function (e) {
  var csms = require(__hooks + "/nuanban_captcha_sms.js");
  return e.json(200, csms.captchaCreateChallenge());
});

routerAdd("POST", "/api/nuanban/captcha/verify", function (e) {
  var csms = require(__hooks + "/nuanban_captcha_sms.js");
  var raw = toString(e.request.body);
  var body = raw ? JSON.parse(raw) : {};
  var selected = body.selectedIds || [];
  var result = csms.captchaVerifyChallenge(String(body.challengeId || ""), selected);
  if (!result.ok) return e.json(400, result);
  return e.json(200, result);
});

/** 自建短信验证码（服务器生成，无第三方平台） */
routerAdd("POST", "/api/nuanban/sms/send", function (e) {
  var csms = require(__hooks + "/nuanban_captcha_sms.js");
  var raw = toString(e.request.body);
  var body = raw ? JSON.parse(raw) : {};
  var result = csms.smsSendCode(
    String(body.phone || ""),
    String(body.captchaToken || ""),
    e
  );
  if (!result.ok) return e.json(400, result);
  return e.json(200, result);
});

routerAdd("GET", "/api/nuanban/platform/sms-outbox", function (e) {
  var csms = require(__hooks + "/nuanban_captcha_sms.js");
  var q = e.request.url.query();
  if (q.get("key") !== "nuanban2026") {
    return e.json(403, { message: "无权查看" });
  }
  return e.json(200, { list: csms.smsOutboxList() });
});

/** 手机号登录：须通过自建短信验证码（演示号可用 000000） */
routerAdd("POST", "/api/nuanban/phone-login", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var csms = require(__hooks + "/nuanban_captcha_sms.js");
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (phone.length !== 11) {
    return e.json(400, { message: "请输入 11 位手机号" });
  }
  const code = body.code != null ? String(body.code).trim() : "";
  if (!code || code.length !== 6) {
    return e.json(400, { message: "请输入 6 位短信验证码" });
  }
  if (!csms.smsVerifyCode(phone, code)) {
    return e.json(400, { message: "验证码错误或已过期，请重新获取" });
  }

  // 与 miniapp demo-rich-data.ts DEMO_TEST_PHONES 对齐
  const phoneToEmail = {
    "13800000001": "student1@test.nuanban.dev",
    "13800000002": "student2@test.nuanban.dev",
    "13800000003": "student3@test.nuanban.dev",
    "13800000004": "family1@test.nuanban.dev",
    "13800000005": "elder1@test.nuanban.dev",
    "13800000006": "multi1@test.nuanban.dev",
  };
  const isPresetPhone = Object.prototype.hasOwnProperty.call(phoneToEmail, phone);
  const email = isPresetPhone ? phoneToEmail[phone] : "m" + phone + "@test.nuanban.dev";

  let users = $app.findRecordsByFilter("users", "email = {:e}", "", 1, 0, { e: email });
  let user;
  if (users.length === 0) {
    if (isPresetPhone) {
      return e.json(404, { message: "用户不存在，请先执行: ./scripts/seed-demo.sh" });
    }
    const usersCol = $app.findCollectionByNameOrId("users");
    user = new Record(usersCol);
    user.set("email", email);
    user.setPassword("nuanban_dev_2025");
    user.set("verified", true);
    user.set("name", "");
    $app.save(user);
  } else {
    user = users[0];
  }

  const roleRecords = $app.findRecordsByFilter(
    "user_roles",
    "user = {:uid}",
    "",
    50,
    0,
    { uid: user.id }
  );
  const roles = [];
  for (let i = 0; i < roleRecords.length; i++) {
    const r = roleRecords[i];
    let elderProfileId = null;
    try {
      const ep = r.getString("elder_profile");
      if (ep) elderProfileId = ep;
    } catch (_) {}
    roles.push({
      role: r.getString("role") || "student",
      status: r.getString("status") || "active",
      elderProfileId: elderProfileId,
    });
  }
  const activeRoles = roles.filter(function (r) {
    return r.status === "active";
  });
  var resolvedActive = null;
  if (activeRoles.length === 1) {
    resolvedActive = activeRoles[0].role;
  } else if (activeRoles.length === 0 && roles.length === 1) {
    resolvedActive = roles[0].role;
  }

  var av = nb.userAvatarFields(user, e);
  var nick = user.getString("name") || "";
  return e.json(200, {
    token: user.newAuthToken(),
    user: {
      id: user.id,
      nickname: nick,
      email: user.getString("email"),
      avatarUrl: av.avatarUrl,
    },
    roles: roles,
    activeRole: resolvedActive,
  });
});

/** 头像上传：uni.uploadFile 仅支持 POST，不能直接 PATCH PB users 记录 */
routerAdd("POST", "/api/nuanban/auth/avatar", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const files = e.findUploadedFiles("avatar");
  if (!files || files.length === 0 || !files[0]) {
    return e.json(400, { message: "请选择图片" });
  }
  auth.set("avatar", files[0]);
  $app.save(auth);
  var av = nb.userAvatarFields(auth, e);
  return e.json(200, { avatar: av.avatar, avatarUrl: av.avatarUrl });
});

routerAdd("GET", "/api/nuanban/auth/me", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const roleRecords = $app.findRecordsByFilter(
    "user_roles",
    "user = {:uid}",
    "",
    50,
    0,
    { uid: auth.id }
  );
  const roles = [];
  for (let i = 0; i < roleRecords.length; i++) {
    const r = roleRecords[i];
    let elderProfileId = null;
    try {
      const ep = r.getString("elder_profile");
      if (ep) elderProfileId = ep;
    } catch (_) {}
    roles.push({
      role: r.getString("role") || "student",
      status: r.getString("status") || "active",
      elderProfileId: elderProfileId,
    });
  }
  var avMe = nb.userAvatarFields(auth, e);
  return e.json(200, {
    user: { id: auth.id, nickname: auth.getString("name"), avatarUrl: avMe.avatarUrl },
    roles: roles,
  });
});

routerAdd("POST", "/api/nuanban/auth/register", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const role = body.role || "student";
  const existing = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = {:role}',
    "",
    1,
    0,
    { uid: auth.id, role }
  );
  if (existing.length > 0) {
    const roleRecords = $app.findRecordsByFilter(
      "user_roles",
      "user = {:uid}",
      "",
      50,
      0,
      { uid: auth.id }
    );
    const roles = [];
    for (let i = 0; i < roleRecords.length; i++) {
      const r = roleRecords[i];
      let elderProfileId = null;
      try {
        const ep = r.getString("elder_profile");
        if (ep) elderProfileId = ep;
      } catch (_) {}
      roles.push({
        role: r.getString("role") || "student",
        status: r.getString("status") || "active",
        elderProfileId: elderProfileId,
      });
    }
    return e.json(200, { ok: true, roles: roles });
  }
  const col = $app.findCollectionByNameOrId("user_roles");
  const rec = new Record(col);
  rec.set("user", auth.id);
  rec.set("role", role);
  rec.set("status", role === "student" ? "pending" : "active");
  if (body.displayName) rec.set("display_name", body.displayName);
  if (body.wechatId) rec.set("wechat_id", String(body.wechatId).trim().slice(0, 64));
  if (body.gender) rec.set("gender", String(body.gender));
  $app.save(rec);
  const roleRecords2 = $app.findRecordsByFilter(
    "user_roles",
    "user = {:uid}",
    "",
    50,
    0,
    { uid: auth.id }
  );
  const roles2 = [];
  for (let i = 0; i < roleRecords2.length; i++) {
    const r = roleRecords2[i];
    let elderProfileId = null;
    try {
      const ep = r.getString("elder_profile");
      if (ep) elderProfileId = ep;
    } catch (_) {}
    roles2.push({
      role: r.getString("role") || "student",
      status: r.getString("status") || "active",
      elderProfileId: elderProfileId,
    });
  }
  return e.json(200, { ok: true, roles: roles2 });
});

routerAdd("GET", "/api/nuanban/elder/caregivers/nearby", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const q = e.request.url.query();
  const lat = parseFloat(q.get("lat") || "0");
  const lng = parseFloat(q.get("lng") || "0");
  const radiusKm = parseFloat(q.get("radiusKm") || "5");

  const students = $app.findRecordsByFilter(
    "user_roles",
    'role = "student" && status = "active"',
    "",
    100,
    0
  );

  const list = [];
  for (let i = 0; i < students.length; i++) {
    const r = students[i];
    const slat = r.getFloat("latitude");
    const slng = r.getFloat("longitude");
    let distanceKm = 999;
    if (lat && lng && slat && slng) {
      const R = 6371;
      const dLat = ((slat - lat) * Math.PI) / 180;
      const dLng = ((slng - lng) * Math.PI) / 180;
      const a =
        Math.pow(Math.sin(dLat / 2), 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((slat * Math.PI) / 180) *
          Math.pow(Math.sin(dLng / 2), 2);
      distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    if (distanceKm <= radiusKm) {
      const schoolId = r.getString("school");
      let schoolName = "";
      if (schoolId) {
        try {
          const s = $app.findRecordById("school_dict", schoolId);
          schoolName = s.getString("name");
        } catch (_) {}
      }
      list.push({
        id: r.id,
        userId: r.getString("user"),
        name: r.getString("display_name") || "同学",
        school: schoolName || "高校志愿者",
        gender: nb.safeRecordString(r, "gender", "未填"),
        distanceKm: Math.round(distanceKm * 10) / 10,
        distance:
          distanceKm < 1
            ? String(Math.round(distanceKm * 1000)) + "m"
            : distanceKm.toFixed(1) + "km",
      });
    }
  }
  list.sort((a, b) => a.distanceKm - b.distanceKm);
  return e.json(200, { list });
});

routerAdd("GET", "/api/nuanban/elder/caregivers/{id}", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const id = e.request.pathValue("id");
  let roleRec = null;
  try {
    roleRec = $app.findRecordById("user_roles", id);
  } catch (_) {
    const byUser = $app.findRecordsByFilter(
      "user_roles",
      'user = {:uid} && role = "student"',
      "",
      1,
      0,
      { uid: id }
    );
    if (byUser.length > 0) roleRec = byUser[0];
  }
  if (!roleRec) {
    return e.json(404, { message: "陪护同学不存在" });
  }
  const schoolId = roleRec.getString("school");
  let schoolName = "高校志愿者";
  if (schoolId) {
    try {
      const s = $app.findRecordById("school_dict", schoolId);
      schoolName = s.getString("name") || schoolName;
    } catch (_) {}
  }
  const name = roleRec.getString("display_name") || "同学";
  return e.json(200, {
    id: roleRec.id,
    userId: roleRec.getString("user"),
    name: name,
    school: schoolName,
    distanceKm: 1.2,
    distance: "1.2km",
    rating: 4.9,
    orderCount: 28,
    intro: name + "——暖伴勤工志愿者",
    tags: ["陪伴聊天", "康复协助"],
    gender: nb.safeRecordString(roleRec, "gender", "未填"),
    major: "护理学",
    grade: "大三",
    age: 21,
    phone: "138****5678",
    bio: name + "，热心公益，擅长陪伴聊天与康复协助。",
    serviceAreas: ["浦东新区", "黄浦区"],
    availableHours: ["周一至周五 14:00–18:00", "周六 9:00–12:00"],
    certifications: ["急救员证", "养老护理员初级"],
    languages: ["普通话", "上海话"],
    personalityTags: ["耐心细致", "开朗活泼"],
    serviceTypes: ["陪伴聊天", "读报陪聊", "康复协助"],
    completedOrderThemes: ["聊天陪伴 ×12", "康复协助 ×5"],
    reviewSummary: "老人评价「很有耐心，聊天很开心」",
  });
});

routerAdd("POST", "/api/nuanban/elder/orders", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const elderId = body.elderId;
  const serviceItemId = body.serviceItemId;
  if (!elderId || !serviceItemId) {
    return e.json(400, { message: "缺少 elderId 或 serviceItemId" });
  }

  let item;
  try {
    item = $app.findRecordById("service_items", serviceItemId);
  } catch (_) {
    return e.json(404, { message: "服务项不存在" });
  }

  const needsOutdoor = item.getBool("requires_outdoor_approval");
  const amount = item.getInt("price_cents");
  let status = "pending_accept";
  let paymentStatus = "paid";
  if (body.requirePayment) {
    status = "pending_payment";
    paymentStatus = "unpaid";
  }

  const ordersCol = $app.findCollectionByNameOrId("orders");
  const order = new Record(ordersCol);
  order.set("elder", elderId);
  order.set("service_item", serviceItemId);
  order.set("source", "elder_self");
  order.set("status", status);
  order.set("payment_status", paymentStatus);
  order.set("amount_cents", amount);
  order.set("created_by", auth.id);
  if (body.studentId) order.set("student_user", body.studentId);
  if (body.scheduledAt) order.set("scheduled_at", body.scheduledAt);
  nb.appendOrderTimeline(order, "created", "预约已提交", "elder");
  if (status === "pending_payment") {
    nb.appendOrderTimeline(order, "pending_payment", "等待家属/老人支付", "system");
  } else {
    nb.appendOrderTimeline(order, "pending_accept", "等待同学接单", "system");
  }
  $app.save(order);

  if (needsOutdoor && status !== "pending_payment") {
    order.set("status", "outdoor_pending");
    $app.save(order);
    const outCol = $app.findCollectionByNameOrId("outdoor_approvals");
    const out = new Record(outCol);
    out.set("order", order.id);
    out.set("status", "pending_family");
    $app.save(out);
  }

  return e.json(200, { id: order.id, status: order.getString("status") });
});

routerAdd("POST", "/api/nuanban/student/order-requests/{id}/accept", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("status") !== "pending_accept") {
    return e.json(400, { message: "订单状态不可接单" });
  }

  const studentRoles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "student"',
    "",
    1,
    0,
    { uid: auth.id }
  );
  if (studentRoles.length > 0 && studentRoles[0].getString("status") !== "active") {
    return e.json(403, { message: "学生资质审核中，暂无法接单" });
  }

  let item;
  try {
    item = $app.findRecordById("service_items", order.getString("service_item"));
  } catch (_) {
    item = null;
  }
  const needsOutdoor = item && item.getBool("requires_outdoor_approval");

  order.set("student_user", auth.id);
  if (needsOutdoor) {
    order.set("status", "outdoor_pending");
    nb.appendOrderTimeline(order, "outdoor_pending", "同学已接单，等待家属审批外出", "student");
    $app.save(order);
    const existing = $app.findRecordsByFilter(
      "outdoor_approvals",
      'order = {:oid}',
      "",
      1,
      0,
      { oid: orderId }
    );
    if (existing.length === 0) {
      const outCol = $app.findCollectionByNameOrId("outdoor_approvals");
      const out = new Record(outCol);
      out.set("order", orderId);
      out.set("status", "pending_family");
      $app.save(out);
    }
  } else {
    order.set("status", "pending_service");
    nb.appendOrderTimeline(order, "pending_service", "同学已接单，请按时到场", "student");
    $app.save(order);
    const schCol = $app.findCollectionByNameOrId("schedules");
    const sch = new Record(schCol);
    sch.set("order", orderId);
    sch.set("elder", order.getString("elder"));
    sch.set("student_user", auth.id);
    sch.set("status", "pending_service");
    sch.set("scheduled_start", order.getString("scheduled_at"));
    $app.save(sch);
  }

  return e.json(200, { ok: true, status: order.getString("status") });
});

routerAdd("POST", "/api/nuanban/student/order-requests/{id}/reject", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  order.set("student_user", "");
  order.set("reject_reason", body.reason || "学生拒绝");
  order.set("status", "pending_accept");
  $app.save(order);
  return e.json(200, { ok: true });
});

routerAdd("POST", "/api/nuanban/family/orders/{id}/pay", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("status") !== "pending_payment") {
    return e.json(400, { message: "订单无需支付" });
  }
  order.set("payment_status", "paid");
  order.set("paid_at", new Date().toISOString());
  order.set("status", "pending_accept");
  $app.save(order);

  let item;
  try {
    item = $app.findRecordById("service_items", order.getString("service_item"));
  } catch (_) {
    item = null;
  }
  if (item && item.getBool("requires_outdoor_approval")) {
    order.set("status", "outdoor_pending");
    $app.save(order);
    const outCol = $app.findCollectionByNameOrId("outdoor_approvals");
    const out = new Record(outCol);
    out.set("order", orderId);
    out.set("status", "pending_family");
    $app.save(out);
  }

  return e.json(200, { ok: true, status: order.getString("status") });
});

routerAdd("POST", "/api/nuanban/family/outdoor/{id}/approve", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const approved = !!body.approved;

  const outs = $app.findRecordsByFilter(
    "outdoor_approvals",
    'order = {:oid}',
    "",
    1,
    0,
    { oid: orderId }
  );
  if (outs.length === 0) {
    return e.json(404, { message: "外出审批不存在" });
  }
  const out = outs[0];
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }

  if (approved) {
    out.set("status", "approved");
    out.set("family_user", auth.id);
    $app.save(out);
    order.set("status", "pending_service");
    $app.save(order);
    const schCol = $app.findCollectionByNameOrId("schedules");
    const existing = $app.findRecordsByFilter(
      "schedules",
      'order = {:oid}',
      "",
      1,
      0,
      { oid: orderId }
    );
    if (existing.length === 0 && order.getString("student_user")) {
      const sch = new Record(schCol);
      sch.set("order", orderId);
      sch.set("elder", order.getString("elder"));
      sch.set("student_user", order.getString("student_user"));
      sch.set("status", "pending_service");
      sch.set("scheduled_start", order.getString("scheduled_at"));
      $app.save(sch);
    }
  } else {
    out.set("status", "rejected");
    out.set("rejected_reason", body.reason || "家属拒绝外出");
    out.set("family_user", auth.id);
    $app.save(out);
    order.set("status", "cancelled");
    $app.save(order);
  }

  return e.json(200, { ok: true, approved });
});

routerAdd("GET", "/api/nuanban/student/orders/pending", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "student");
  if (!rc.ok) return e.json(rc.code, rc.body);
  try {
    const records = $app.findRecordsByFilter(
      "orders",
      'status = "pending_accept"',
      "",
      50,
      0
    );
    const list = [];
    for (let i = 0; i < records.length; i++) {
      try {
        list.push(nb.orderToStudentDto(records[i]));
      } catch (err) {
        // 单条坏数据不影响整页
      }
    }
    return e.json(200, { list: list });
  } catch (err) {
    return e.json(200, { list: [], error: String(err && err.message ? err.message : err) });
  }
});

routerAdd("GET", "/api/nuanban/student/elders/nearby", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "student");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  try {
    const q = e.request.url.query();
    const lat = parseFloat(q.get("lat") || "0");
    const lng = parseFloat(q.get("lng") || "0");
    const radiusKm = parseFloat(q.get("radiusKm") || "5");
    const records = $app.findRecordsByFilter("elders", "enabled = true", "", 50, 0);
    const list = [];
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const elat = nb.safeRecordFloat(rec, "latitude", 0);
      const elng = nb.safeRecordFloat(rec, "longitude", 0);
      let distanceKm = 999;
      if (lat && lng && elat && elng) {
        distanceKm = nb.haversineM(lat, lng, elat, elng) / 1000;
      }
      if (distanceKm > radiusKm) continue;
      let orgName = "暖伴示范养老院";
      let orgId = nb.safeRecordString(rec, "org", "");
      if (orgId) {
        try {
          const org = $app.findRecordById("organizations", orgId);
          orgName = nb.safeRecordString(org, "name", orgName);
        } catch (_) {}
      }
      list.push({
        id: rec.id,
        name: nb.safeRecordString(rec, "name", "老人"),
        gender: nb.safeRecordString(rec, "gender", "未填"),
        latitude: elat,
        longitude: elng,
        org: orgId,
        orgName: orgName,
        distanceKm: Math.round(distanceKm * 100) / 100,
        expand: { org: { id: orgId, name: orgName } },
      });
    }
    list.sort(function (a, b) {
      return a.distanceKm - b.distanceKm;
    });
    return e.json(200, { list: list });
  } catch (err) {
    return e.json(400, { message: String(err && err.message ? err.message : err), list: [] });
  }
});

routerAdd("GET", "/api/nuanban/student/profile", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  try {
    const rc = nb.assertActiveRoleHeader(e, "student");
    if (!rc.ok) return e.json(rc.code, rc.body);
    const auth = e.auth;
    if (!auth) return e.json(401, { message: "需要登录" });
    let schoolName = "";
    let displayName = "";
    const roles = $app.findRecordsByFilter(
      "user_roles",
      'user = {:uid} && role = "student"',
      "",
      1,
      0,
      { uid: auth.id }
    );
    if (roles.length > 0) {
      const r = roles[0];
      displayName = nb.safeRecordString(r, "display_name", "");
      const schoolId = nb.safeRecordString(r, "school", "");
      if (schoolId) {
        try {
          const s = $app.findRecordById("school_dict", schoolId);
          schoolName = nb.safeRecordString(s, "name", "");
        } catch (_) {}
      }
      var cartoonAvatarId = nb.safeRecordString(r, "cartoon_avatar_id", "");
      var verificationPhotoUrl = nb.roleFileUrlForClient(r, "verification_photo", e);
    } else {
      var cartoonAvatarId = "";
      var verificationPhotoUrl = "";
    }
    var av = nb.userAvatarFields(auth, e);
    const profileComplete = !!(displayName && schoolName);
    return e.json(200, {
      nickname: nb.safeRecordString(auth, "name", displayName || "学生"),
      email: nb.safeRecordString(auth, "email", ""),
      schoolName: schoolName,
      displayName: displayName,
      profileComplete: profileComplete,
      cartoonAvatarId: cartoonAvatarId,
      avatarUrl: av.avatarUrl,
      verificationPhotoUrl: verificationPhotoUrl,
      gender: roles.length > 0 ? nb.safeRecordString(roles[0], "gender", "未填") : "未填",
      major: "护理学",
      grade: "大三",
      age: 21,
      phone: "138****1234",
      bio: "热心公益的在校女生，擅长陪伴聊天与康复协助。",
      serviceAreas: ["浦东新区", "黄浦区"],
      availableHours: ["周一至周五 14:00–18:00", "周六 9:00–12:00"],
      certifications: ["急救员证", "养老护理员初级"],
      languages: ["普通话", "上海话"],
      personalityTags: ["耐心细致", "开朗活泼"],
      serviceTypes: ["陪伴聊天", "读报陪聊", "康复协助"],
      completedOrderThemes: ["聊天陪伴 ×12", "康复协助 ×5"],
      rating: 4.9,
      orderCount: 35,
    });
  } catch (err) {
    return e.json(400, { message: String(err && err.message ? err.message : err) });
  }
});

routerAdd("PATCH", "/api/nuanban/student/profile", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const roles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "student"',
    "",
    1,
    0,
    { uid: auth.id }
  );
  if (roles.length === 0) {
    return e.json(404, { message: "学生角色不存在" });
  }
  const roleRec = roles[0];
  let displayName = roleRec.getString("display_name") || "";
  let schoolName = "";
  if (body.displayName) {
    displayName = String(body.displayName);
    roleRec.set("display_name", displayName);
  }
  if (body.schoolName) {
    schoolName = String(body.schoolName).trim();
    if (!nb.isKnownSchool(schoolName)) {
      return e.json(400, { message: "请从列表中选择有效学校" });
    }
    const schoolRec = nb.findOrCreateSchoolByName(schoolName);
    roleRec.set("school", schoolRec.id);
  } else {
    const schoolId = roleRec.getString("school");
    if (schoolId) {
      try {
        const s = $app.findRecordById("school_dict", schoolId);
        schoolName = s.getString("name");
      } catch (_) {}
    }
  }
  if (body.cartoonAvatarId) {
    roleRec.set("cartoon_avatar_id", String(body.cartoonAvatarId));
  }
  if (body.gender) {
    roleRec.set("gender", String(body.gender));
  }
  $app.save(roleRec);
  if (body.displayName) {
    auth.set("name", displayName);
    $app.save(auth);
  }
  return e.json(200, {
    ok: true,
    displayName: displayName,
    schoolName: schoolName,
    profileComplete: !!(displayName && schoolName),
    cartoonAvatarId: roleRec.getString("cartoon_avatar_id") || "",
    verificationPhotoUrl: nb.roleFileUrlForClient(roleRec, "verification_photo", e),
    bio: body.bio || "热心公益的在校女生，擅长陪伴聊天与康复协助。",
    major: body.major || "护理学",
    grade: body.grade || "大三",
    availableHours: body.availableHours || ["周一至周五 14:00–18:00", "周六 9:00–12:00"],
    serviceAreas: body.serviceAreas || ["浦东新区", "黄浦区"],
  });
});

routerAdd("POST", "/api/nuanban/student/verification-photo", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "student");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const roleRec = nb.studentRoleRecord(auth.id);
  if (!roleRec) return e.json(404, { message: "学生角色不存在" });
  const files = e.findUploadedFiles("photo");
  if (!files || files.length === 0 || !files[0]) {
    return e.json(400, { message: "请拍摄核验照片" });
  }
  roleRec.set("verification_photo", files[0]);
  $app.save(roleRec);
  return e.json(200, {
    ok: true,
    verificationPhotoUrl: nb.roleFileUrlForClient(roleRec, "verification_photo", e),
  });
});

routerAdd("GET", "/api/nuanban/student/elders/{id}/profile", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "student");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const elderId = e.request.pathValue("id");
  let elder;
  try {
    elder = $app.findRecordById("elders", elderId);
  } catch (_) {
    return e.json(404, { message: "老人档案不存在" });
  }
  let orgName = "";
  const orgId = elder.getString("org");
  if (orgId) {
    try {
      const o = $app.findRecordById("orgs", orgId);
      orgName = o.getString("name");
    } catch (_) {}
  }
  return e.json(200, {
    id: elder.id,
    name: elder.getString("name") || "老人",
    age: elder.getInt("age") || 78,
    gender: elder.getString("gender") || "女",
    district: elder.getString("district") || "浦东新区",
    address: elder.getString("address") || "浦东新区***",
    orgName: orgName || "暖伴示范养老院",
    tags: elder.get("tags") || ["行动便利"],
    intro: elder.getString("intro") || "",
    healthStatus: elder.getString("health_status") || "总体良好",
    mobility: elder.getString("mobility") || "行动便利",
    hobbies: elder.get("hobbies") || ["聊天", "散步"],
    servicePreferences: elder.get("service_preferences") || ["陪伴聊天"],
    livingSituation: elder.getString("living_situation") || "与子女同住",
    emergencyContact: {
      name: "家属",
      relation: "女儿",
      phone: "138****9999",
    },
    preferredVisitTimes: ["工作日下午 14:00–17:00", "周末上午 9:00–11:00"],
    notes: elder.getString("notes") || "请耐心沟通，营造温馨氛围。",
  });
});

routerAdd("GET", "/api/nuanban/elder/profile", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const roles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "elder"',
    "",
    1,
    0,
    { uid: auth.id }
  );
  let elderId = "";
  if (roles.length > 0) {
    try {
      elderId = roles[0].getString("elder_profile") || "";
    } catch (_) {}
  }
  let elder = null;
  if (elderId) {
    try {
      elder = $app.findRecordById("elders", elderId);
    } catch (_) {}
  }
  if (!elder) {
    const found = $app.findRecordsByFilter("elders", 'enabled = true', "", 1, 0);
    if (found.length > 0) elder = found[0];
  }
  if (!elder) return e.json(404, { message: "老人档案不存在" });
  let orgName = "";
  const orgId = elder.getString("org");
  if (orgId) {
    try {
      const o = $app.findRecordById("orgs", orgId);
      orgName = o.getString("name");
    } catch (_) {}
  }
  var avE = nb.userAvatarFields(auth, e);
  const elderName = elder.getString("name") || "";
  const elderDistrict = elder.getString("district") || "";
  const elderAddress = elder.getString("address") || "";
  const hobbies = elder.get("hobbies");
  const servicePrefs = elder.get("service_preferences");
  return e.json(200, {
    id: elder.id,
    name: elderName,
    avatarUrl: avE.avatarUrl,
    profileComplete: true,
    age: elder.getInt("age") || 0,
    gender: elder.getString("gender") || "",
    district: elderDistrict,
    address: elderAddress,
    orgName: orgName || "",
    healthStatus: elder.getString("health_status") || "",
    mobility: elder.getString("mobility") || "",
    hobbies: hobbies && hobbies.length ? hobbies : [],
    servicePreferences: servicePrefs && servicePrefs.length ? servicePrefs : [],
    livingSituation: elder.getString("living_situation") || "",
    emergencyContact: {
      name: elder.getString("emergency_contact_name") || "",
      relation: elder.getString("emergency_contact_relation") || "",
      phone: elder.getString("emergency_contact_phone") || "",
    },
    preferredVisitTimes: elder.get("preferred_visit_times") || [],
    notes: elder.getString("notes") || "",
  });
});

routerAdd("PATCH", "/api/nuanban/elder/profile", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const roles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "elder"',
    "",
    1,
    0,
    { uid: auth.id }
  );
  let elderId = "";
  if (roles.length > 0) {
    try {
      elderId = roles[0].getString("elder_profile") || "";
    } catch (_) {}
  }
  let elder = null;
  if (elderId) {
    try {
      elder = $app.findRecordById("elders", elderId);
    } catch (_) {}
  }
  if (!elder) return e.json(404, { message: "老人档案不存在" });
  if (body.name != null) elder.set("name", String(body.name));
  if (body.age != null) elder.set("age", Number(body.age));
  if (body.gender) elder.set("gender", String(body.gender));
  if (body.address != null) elder.set("address", String(body.address));
  if (body.emergencyContactName != null) {
    elder.set("emergency_contact_name", String(body.emergencyContactName));
  }
  if (body.emergencyContactRelation != null) {
    elder.set("emergency_contact_relation", String(body.emergencyContactRelation));
  }
  if (body.emergencyContactPhone != null) {
    elder.set("emergency_contact_phone", String(body.emergencyContactPhone));
  }
  $app.save(elder);
  if (body.name) {
    auth.set("name", String(body.name));
    $app.save(auth);
  }
  const name = elder.getString("name") || "";
  const address = elder.getString("address") || "";
  return e.json(200, {
    ok: true,
    name: name,
    address: address,
    profileComplete: true,
  });
});

routerAdd("GET", "/api/nuanban/family/profile", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const bindings = $app.findRecordsByFilter(
    "family_elder_bindings",
    'family_user = {:uid}',
    "",
    1,
    0,
    { uid: auth.id }
  );
  let elderName = "张奶奶";
  let elderId = "elder-1";
  let relation = "家属";
  if (bindings.length > 0) {
    const b = bindings[0];
    relation = b.getString("relation_label") || relation;
    elderId = b.getString("elder") || elderId;
    try {
      const elder = $app.findRecordById("elders", elderId);
      elderName = elder.getString("name") || elderName;
    } catch (_) {}
  }
  var avF = nb.userAvatarFields(auth, e);
  const nickname = auth.getString("name") || "家属";
  const contactPhone = "138****8888";
  const district = "浦东新区";
  return e.json(200, {
    nickname: nickname,
    email: auth.getString("email"),
    avatarUrl: avF.avatarUrl,
    profileComplete: !!(nickname && contactPhone && district),
    relationToElder: relation,
    linkedElderName: elderName,
    linkedElderId: elderId,
    contactPhone: contactPhone,
    district: district,
    address: "浦东新区花木路***室",
    notificationPrefs: ["订单状态变更", "外出审批提醒", "SOS 紧急通知", "支付成功通知"],
  });
});

routerAdd("PATCH", "/api/nuanban/family/profile", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  if (body.nickname) {
    auth.set("name", String(body.nickname));
    $app.save(auth);
  }
  const nickname = auth.getString("name") || "";
  const contactPhone = body.contactPhone ? String(body.contactPhone) : "138****8888";
  const district = body.district ? String(body.district) : "浦东新区";
  return e.json(200, {
    ok: true,
    nickname: nickname,
    contactPhone: contactPhone,
    district: district,
    address: body.address ? String(body.address) : "浦东新区花木路***室",
    relationToElder: body.relationToElder ? String(body.relationToElder) : "家属",
    profileComplete: !!(nickname && contactPhone && district),
  });
});

routerAdd("GET", "/api/nuanban/org/orders/dispatchable", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const records = $app.findRecordsByFilter(
    "orders",
    'status = "pending_accept" && student_user = ""',
    "-scheduled_at",
    50,
    0
  );
  const list = [];
  for (let i = 0; i < records.length; i++) {
    list.push(nb.orderToStudentDto(records[i]));
  }
  return e.json(200, { list: list });
});

routerAdd("POST", "/api/nuanban/org/orders/{id}/dispatch", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const orderId = e.request.pathValue("id");
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("status") !== "pending_accept") {
    return e.json(400, { message: "订单不可派单" });
  }
  let studentUserId = body.studentUserId || "";
  if (!studentUserId) {
    const students = $app.findRecordsByFilter(
      "users",
      "email = {:e}",
      "",
      1,
      0,
      { e: "student1@test.nuanban.dev" }
    );
    if (students.length > 0) studentUserId = students[0].id;
  }
  if (!studentUserId) {
    return e.json(400, { message: "缺少 studentUserId" });
  }
  order.set("student_user", studentUserId);
  order.set("status", "pending_service");
  $app.save(order);
  const schCol = $app.findCollectionByNameOrId("schedules");
  const existing = $app.findRecordsByFilter(
    "schedules",
    "order = {:oid}",
    "",
    1,
    0,
    { oid: orderId }
  );
  if (existing.length === 0) {
    const sch = new Record(schCol);
    sch.set("order", orderId);
    sch.set("elder", order.getString("elder"));
    sch.set("student_user", studentUserId);
    sch.set("status", "pending_service");
    sch.set("scheduled_start", order.getString("scheduled_at"));
    $app.save(sch);
  }
  return e.json(200, { ok: true, status: order.getString("status") });
});

routerAdd("GET", "/api/nuanban/student/stats", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthPrefix = year + "-" + (month < 10 ? "0" + month : "" + month);
  const records = $app.findRecordsByFilter(
    "orders",
    "student_user = {:uid}",
    "",
    200,
    0,
    { uid: auth.id }
  );
  let acceptedCount = 0;
  let monthCount = 0;
  let incomeCents = 0;
  const acceptedStatuses = {
    pending_service: true,
    in_service: true,
    pending_confirm: true,
    completed: true,
  };
  for (let i = 0; i < records.length; i++) {
    const o = records[i];
    const st = o.getString("status");
    if (acceptedStatuses[st]) {
      acceptedCount += 1;
      const scheduled = o.getString("scheduled_at") || "";
      if (scheduled.indexOf(monthPrefix) === 0) monthCount += 1;
    }
    if (st === "completed" && o.getString("payment_status") === "paid") {
      incomeCents += o.getInt("amount_cents") || 0;
    }
  }
  let pendingCount = 0;
  try {
    const pending = $app.findRecordsByFilter(
      "orders",
      'status = "pending_accept"',
      "",
      50,
      0
    );
    pendingCount = pending.length;
  } catch (_) {}

  return e.json(200, {
    acceptedCount: acceptedCount,
    monthCount: monthCount,
    pendingCount: pendingCount,
    incomeCents: incomeCents,
    incomeYuan: (incomeCents / 100).toFixed(2),
  });
});

routerAdd("GET", "/api/nuanban/family/wallet", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  return e.json(200, nb.walletOverviewDto(nb.walletEnsureUser(e.auth.id)));
});

routerAdd("POST", "/api/nuanban/family/wallet/topup", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const result = nb.walletTopup(e.auth.id, parseInt(body.amountCents, 10) || 0);
  if (!result.ok) return e.json(400, { message: result.message });
  return e.json(200, result.overview);
});

routerAdd("POST", "/api/nuanban/family/wallet/pay-order", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const orderId = String(body.orderId || "");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (!nb.familyCanAccessOrder(e.auth.id, order)) {
    return e.json(403, { message: "无权支付该订单" });
  }
  const result = nb.walletPayOrderRecord(e.auth.id, order);
  if (!result.ok) return e.json(400, { message: result.message });
  return e.json(200, { ok: true, status: result.status, overview: result.overview });
});

routerAdd("GET", "/api/nuanban/elder/wallet", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  return e.json(200, nb.walletOverviewDto(nb.walletEnsureUser(e.auth.id)));
});

routerAdd("POST", "/api/nuanban/elder/wallet/topup", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const result = nb.walletTopup(e.auth.id, parseInt(body.amountCents, 10) || 0);
  if (!result.ok) return e.json(400, { message: result.message });
  return e.json(200, result.overview);
});

routerAdd("POST", "/api/nuanban/elder/wallet/pay-order", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const orderId = String(body.orderId || "");
  const elderId = nb.elderProfileIdForUser(e.auth.id);
  if (!elderId) return e.json(403, { message: "未绑定老人档案" });
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("elder") !== elderId) {
    return e.json(403, { message: "无权支付该订单" });
  }
  const result = nb.walletPayOrderRecord(e.auth.id, order);
  if (!result.ok) return e.json(400, { message: result.message });
  return e.json(200, { ok: true, status: result.status, overview: result.overview });
});

var paymentAccountDemoStore = paymentAccountDemoStore || {};

function paymentAccountDemoKey(uid, role) {
  return uid + ":" + role;
}

function paymentAccountDemoDto(uid, role) {
  var st = paymentAccountDemoStore[paymentAccountDemoKey(uid, role)];
  if (!st || !st.configured) {
    return { provider: "saobei", configured: false };
  }
  var tail = String(st.merchantNo || "").slice(-4) || "8029";
  return {
    provider: "saobei",
    configured: true,
    merchantNo: st.merchantNo,
    accountName: st.accountName,
    accountLabel: st.accountLabel || "扫呗 · ****" + tail,
  };
}

function seedPaymentAccountDemoForUser(auth, role) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var em = nb.safeRecordString(auth, "email", "").toLowerCase();
  if (em.indexOf("student3") >= 0) return;
  var roles = [];
  if (em.indexOf("multi") >= 0) roles = ["student", "family", "elder"];
  else {
    if (em.indexOf("student") >= 0) roles.push("student");
    if (em.indexOf("family") >= 0) roles.push("family");
    if (em.indexOf("elder") >= 0) roles.push("elder");
  }
  if (roles.indexOf(role) < 0) return;
  paymentAccountDemoStore[paymentAccountDemoKey(auth.id, role)] = {
    configured: true,
    merchantNo: "80291234",
    accountName: "演示账户",
    accountLabel: "扫呗 · ****1234",
  };
}

function registerPaymentAccountRoutes(role) {
  routerAdd("GET", "/api/nuanban/" + role + "/payment-account", function (e) {
    var nb = require(__hooks + "/nuanban_lib.js");
    const rc = nb.assertActiveRoleHeader(e, role);
    if (!rc.ok) return e.json(rc.code, rc.body);
    if (!e.auth) return e.json(401, { message: "需要登录" });
    seedPaymentAccountDemoForUser(e.auth, role);
    return e.json(200, paymentAccountDemoDto(e.auth.id, role));
  });
  routerAdd("POST", "/api/nuanban/" + role + "/payment-account", function (e) {
    var nb = require(__hooks + "/nuanban_lib.js");
    const rc = nb.assertActiveRoleHeader(e, role);
    if (!rc.ok) return e.json(rc.code, rc.body);
    if (!e.auth) return e.json(401, { message: "需要登录" });
    const raw = toString(e.request.body);
    const body = raw ? JSON.parse(raw) : {};
    const merchantNo = String(body.merchantNo || "").trim();
    const accountName = String(body.accountName || "").trim();
    if (!merchantNo || !accountName) {
      return e.json(400, { message: "请填写商户号与账户名称" });
    }
    var tail = merchantNo.slice(-4);
    paymentAccountDemoStore[paymentAccountDemoKey(e.auth.id, role)] = {
      configured: true,
      merchantNo: merchantNo,
      accountName: accountName,
      accountLabel: "扫呗 · ****" + tail,
    };
    return e.json(200, paymentAccountDemoDto(e.auth.id, role));
  });
}

registerPaymentAccountRoutes("student");
registerPaymentAccountRoutes("family");
registerPaymentAccountRoutes("elder");

routerAdd("GET", "/api/nuanban/family/stats", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const bindings = $app.findRecordsByFilter(
    "family_elder_bindings",
    "family_user = {:uid}",
    "",
    50,
    0,
    { uid: auth.id }
  );
  const pending = $app.findRecordsByFilter(
    "orders",
    'family_user = {:uid} && status = "pending_payment"',
    "",
    50,
    0,
    { uid: auth.id }
  );
  let pendingConfirm = 0;
  try {
    const bindings = $app.findRecordsByFilter(
      "family_elder_bindings",
      "family_user = {:uid}",
      "",
      50,
      0,
      { uid: auth.id }
    );
    for (let i = 0; i < bindings.length; i++) {
      const elderId = bindings[i].getString("elder");
      const rows = $app.findRecordsByFilter(
        "orders",
        'elder = {:eid} && status = "pending_confirm"',
        "",
        50,
        0,
        { eid: elderId }
      );
      pendingConfirm += rows.length;
    }
  } catch (_) {}
  let paidCents = 0;
  const paid = $app.findRecordsByFilter(
    "orders",
    'family_user = {:uid} && payment_status = "paid"',
    "",
    100,
    0,
    { uid: auth.id }
  );
  for (let i = 0; i < paid.length; i++) {
    paidCents += paid[i].getInt("amount_cents") || 0;
  }
  let outdoorPending = 0;
  try {
    const outdoor = $app.findRecordsByFilter(
      "outdoor_approvals",
      'family_user = {:uid} && status = "pending_family"',
      "",
      50,
      0,
      { uid: auth.id }
    );
    outdoorPending = outdoor.length;
  } catch (_) {}
  let sosPending = 0;
  try {
    const sos = $app.findRecordsByFilter(
      "sos_alerts",
      'status = "active"',
      "",
      50,
      0
    );
    sosPending = sos.length;
  } catch (_) {}
  return e.json(200, {
    boundElderCount: bindings.length,
    pendingPaymentCount: pending.length,
    pendingConfirmCount: pendingConfirm,
    outdoorPendingCount: outdoorPending,
    sosPendingCount: sosPending,
    paidTotalCents: paidCents,
    paidTotalYuan: (paidCents / 100).toFixed(2),
  });
});

routerAdd("GET", "/api/nuanban/elder/stats", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  let elderProfileId = null;
  let elderName = "";
  const roles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "elder"',
    "",
    1,
    0,
    { uid: auth.id }
  );
  if (roles.length > 0) {
    try {
      elderProfileId = roles[0].getString("elder_profile");
    } catch (_) {}
    if (elderProfileId) {
      try {
        const elder = $app.findRecordById("elders", elderProfileId);
        elderName = elder.getString("name");
      } catch (_) {}
    }
  }
  let orderCount = 0;
  let activeCount = 0;
  if (elderProfileId) {
    const orders = $app.findRecordsByFilter(
      "orders",
      "elder = {:eid}",
      "",
      100,
      0,
      { eid: elderProfileId }
    );
    orderCount = orders.length;
    for (let i = 0; i < orders.length; i++) {
      const st = orders[i].getString("status");
      if (st === "pending_service" || st === "in_service" || st === "pending_confirm") {
        activeCount += 1;
      }
    }
  }
  return e.json(200, {
    elderProfileId: elderProfileId,
    elderName: elderName,
    orderCount: orderCount,
    activeCount: activeCount,
    caregiverNearbyCount: 4,
  });
});

routerAdd("GET", "/api/nuanban/student/orders/active", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  try {
    const records = $app.findRecordsByFilter(
      "orders",
      'student_user = {:uid} && (status = "pending_service" || status = "in_service")',
      "",
      50,
      0,
      { uid: auth.id }
    );
    const list = [];
    for (let i = 0; i < records.length; i++) {
      try {
        list.push(nb.orderToStudentDto(records[i]));
      } catch (_) {}
    }
    return e.json(200, { list: list });
  } catch (err) {
    return e.json(200, { list: [], error: String(err && err.message ? err.message : err) });
  }
});

routerAdd("GET", "/api/nuanban/student/orders/{id}", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  return e.json(200, nb.orderToStudentDto(order));
});

routerAdd("POST", "/api/nuanban/student/orders/{id}/start", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("status") !== "pending_service") {
    return e.json(400, { message: "当前状态不可开始服务" });
  }
  order.set("status", "in_service");
  nb.appendOrderTimeline(order, "in_service", "同学已开始服务", "student");
  $app.save(order);
  const schs = $app.findRecordsByFilter(
    "schedules",
    "order = {:oid}",
    "",
    1,
    0,
    { oid: orderId }
  );
  if (schs.length > 0) {
    schs[0].set("status", "in_service");
    $app.save(schs[0]);
  }
  return e.json(200, { ok: true, status: "in_service" });
});

routerAdd("POST", "/api/nuanban/student/orders/{id}/complete", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("status") !== "in_service") {
    return e.json(400, { message: "当前状态不可完成" });
  }
  order.set("status", "pending_confirm");
  nb.appendOrderTimeline(order, "pending_confirm", "服务已结束，等待家属/老人确认", "student");
  $app.save(order);
  nb.completeOrderSchedule(orderId, "pending_confirm");
  return e.json(200, { ok: true, status: "pending_confirm" });
});

routerAdd("POST", "/api/nuanban/family/orders/{id}/confirm-complete", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (!nb.familyCanAccessOrder(e.auth.id, order)) {
    return e.json(403, { message: "无权确认该订单" });
  }
  if (order.getString("status") !== "pending_confirm") {
    return e.json(400, { message: "订单不在待确认状态" });
  }
  const rawFamilyConfirm = toString(e.request.body);
  const bodyFamilyConfirm = rawFamilyConfirm ? JSON.parse(rawFamilyConfirm) : {};
  if (
    order.getString("payment_status") === "unpaid" &&
    bodyFamilyConfirm.payMethod === "wallet"
  ) {
    const payResult = nb.walletPayOrderRecord(e.auth.id, order);
    if (!payResult.ok) return e.json(400, { message: payResult.message });
  }
  nb.finalizeOrderAfterConfirm(order);
  return e.json(200, {
    ok: true,
    status: "completed",
    payment_status: order.getString("payment_status"),
  });
});

routerAdd("GET", "/api/nuanban/elder/orders/{id}", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  const elderId = nb.elderProfileIdForUser(auth.id);
  if (!elderId) return e.json(403, { message: "未绑定老人档案" });
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("elder") !== elderId) {
    return e.json(403, { message: "无权查看该订单" });
  }
  return e.json(200, nb.orderToElderDto(order));
});

routerAdd("POST", "/api/nuanban/elder/orders/{id}/confirm-complete", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  const elderId = nb.elderProfileIdForUser(e.auth.id);
  if (!elderId) return e.json(403, { message: "未绑定老人档案" });
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("elder") !== elderId) {
    return e.json(403, { message: "无权确认该订单" });
  }
  if (order.getString("status") !== "pending_confirm") {
    return e.json(400, { message: "订单不在待确认状态" });
  }
  const rawElderConfirm = toString(e.request.body);
  const bodyElderConfirm = rawElderConfirm ? JSON.parse(rawElderConfirm) : {};
  if (
    order.getString("payment_status") === "unpaid" &&
    bodyElderConfirm.payMethod === "wallet"
  ) {
    const payResult = nb.walletPayOrderRecord(e.auth.id, order);
    if (!payResult.ok) return e.json(400, { message: payResult.message });
  }
  nb.finalizeOrderAfterConfirm(order);
  return e.json(200, {
    ok: true,
    status: "completed",
    payment_status: order.getString("payment_status"),
  });
});

routerAdd("GET", "/api/nuanban/student/income", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthPrefix = year + "-" + (month < 10 ? "0" + month : "" + month);
  const records = $app.findRecordsByFilter(
    "orders",
    'student_user = {:uid} && status = "completed" && payment_status = "paid"',
    "-scheduled_at",
    100,
    0,
    { uid: auth.id }
  );
  let monthIncome = 0;
  let totalIncome = 0;
  const list = [];
  for (let i = 0; i < records.length; i++) {
    const o = records[i];
    const cents = o.getInt("amount_cents") || 0;
    totalIncome += cents;
    const scheduled = o.getString("scheduled_at") || "";
    if (scheduled.indexOf(monthPrefix) === 0) monthIncome += cents;
    const svc = nb.serviceInfoById(o.getString("service_item"));
    list.push({
      id: o.id,
      elderName: nb.elderNameById(o.getString("elder")),
      serviceName: svc.name,
      amountCents: cents,
      completedAt: scheduled,
    });
  }
  return e.json(200, {
    monthIncomeCents: monthIncome,
    monthIncomeYuan: (monthIncome / 100).toFixed(2),
    totalIncomeCents: totalIncome,
    totalIncomeYuan: (totalIncome / 100).toFixed(2),
    records: list,
  });
});

routerAdd("GET", "/api/nuanban/student/schedules", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const records = $app.findRecordsByFilter(
    "schedules",
    "student_user = {:uid}",
    "-scheduled_start",
    50,
    0,
    { uid: auth.id }
  );
  const list = [];
  for (let i = 0; i < records.length; i++) {
    const sch = records[i];
    let orderId = "";
    let serviceName = "陪护服务";
    let elderName = nb.elderNameById(sch.getString("elder"));
    try {
      const order = $app.findRecordById("orders", sch.getString("order"));
      orderId = order.id;
      serviceName = nb.serviceInfoById(order.getString("service_item")).name;
    } catch (_) {}
    list.push({
      id: sch.id,
      orderId: orderId,
      elderName: elderName,
      serviceName: serviceName,
      status: sch.getString("status"),
      scheduledStart: sch.getString("scheduled_start"),
    });
  }
  return e.json(200, { list: list });
});

routerAdd("POST", "/api/nuanban/elder/sos", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const elderId = body.elderId || "";
  if (!elderId) return e.json(400, { message: "缺少 elderId" });
  let col;
  try {
    col = $app.findCollectionByNameOrId("sos_alerts");
  } catch (_) {
    return e.json(503, { message: "SOS 集合未就绪，请重启 PocketBase 加载 schema" });
  }
  const rec = new Record(col);
  rec.set("elder", elderId);
  rec.set("message", body.message || "老人发起一键求助");
  rec.set("status", "active");
  $app.save(rec);
  return e.json(200, { id: rec.id, ok: true });
});

routerAdd("GET", "/api/nuanban/family/sos/active", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  let records = [];
  try {
    records = $app.findRecordsByFilter(
      "sos_alerts",
      'status = "active"',
      "-created",
      20,
      0
    );
  } catch (_) {
    return e.json(200, { list: [] });
  }
  const list = [];
  for (let i = 0; i < records.length; i++) {
    list.push(nb.sosToDto(records[i]));
  }
  return e.json(200, { list: list });
});

routerAdd("POST", "/api/nuanban/family/sos/{id}/ack", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const id = e.request.pathValue("id");
  let rec;
  try {
    rec = $app.findRecordById("sos_alerts", id);
  } catch (_) {
    return e.json(404, { message: "记录不存在" });
  }
  rec.set("status", "acknowledged");
  $app.save(rec);
  return e.json(200, { ok: true });
});

routerAdd("GET", "/api/nuanban/student/sos/active", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  let records = [];
  try {
    records = $app.findRecordsByFilter(
      "sos_alerts",
      'status = "active"',
      "-created",
      20,
      0
    );
  } catch (_) {
    return e.json(200, { list: [] });
  }
  const list = [];
  for (let i = 0; i < records.length; i++) {
    list.push(nb.sosToDto(records[i]));
  }
  return e.json(200, { list: list });
});

routerAdd("POST", "/api/nuanban/student/sos/{id}/ack", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const id = e.request.pathValue("id");
  let rec;
  try {
    rec = $app.findRecordById("sos_alerts", id);
  } catch (_) {
    return e.json(404, { message: "记录不存在" });
  }
  rec.set("status", "acknowledged");
  $app.save(rec);
  return e.json(200, { ok: true });
});

routerAdd("POST", "/api/nuanban/student/orders/{id}/checkin", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (order.getString("status") !== "pending_service") {
    return e.json(400, { message: "当前状态不可签到" });
  }
  const lat = parseFloat(body.lat);
  const lng = parseFloat(body.lng);
  if (!isNaN(lat) && !isNaN(lng)) {
    try {
      const elder = $app.findRecordById("elders", order.getString("elder"));
      const elat = elder.getFloat("latitude");
      const elng = elder.getFloat("longitude");
      if (elat && elng && nb.haversineM(lat, lng, elat, elng) > 500) {
        return e.json(400, { message: "未进入服务点 500m 围栏" });
      }
    } catch (_) {}
  }
  order.set("status", "in_service");
  nb.appendOrderTimeline(order, "in_service", "已到场签到，开始服务", "student");
  $app.save(order);
  const schs = $app.findRecordsByFilter(
    "schedules",
    "order = {:oid}",
    "",
    1,
    0,
    { oid: orderId }
  );
  if (schs.length > 0) {
    schs[0].set("status", "in_service");
    $app.save(schs[0]);
  }
  return e.json(200, { ok: true, status: "in_service" });
});

routerAdd("GET", "/api/nuanban/student/service-logs", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const records = $app.findRecordsByFilter(
    "orders",
    'student_user = {:uid} && status = "completed"',
    "-scheduled_at",
    50,
    0,
    { uid: auth.id }
  );
  const summaries = [
    "陪老人读报，情绪稳定",
    "完成康复操，血压正常",
    "陪同散步约 1km",
    "用药提醒已执行",
    "棋牌陪伴，兴致良好",
  ];
  const list = [];
  for (let i = 0; i < records.length; i++) {
    const o = records[i];
    const svc = nb.serviceInfoById(o.getString("service_item"));
    list.push({
      id: "log-" + o.id,
      orderId: o.id,
      elderId: o.getString("elder"),
      elderName: nb.elderNameById(o.getString("elder")),
      serviceName: svc.name,
      summary: summaries[i % summaries.length],
      createdAt: o.getString("scheduled_at"),
    });
  }
  return e.json(200, { list: list });
});

routerAdd("GET", "/api/nuanban/family/orders/{id}", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  return e.json(200, nb.orderToFamilyDto(order));
});

routerAdd("GET", "/api/nuanban/student/referral", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "student");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  const code = "NB" + String(e.auth.id || "DEMO").slice(-4).toUpperCase();
  const base = nb.h5AppBaseUrl(e);
  return e.json(200, {
    code: code,
    inviteLink: base + "/#/pages/common/launch?ref=" + encodeURIComponent(code),
    rewardPerInviteCents: 500,
    rewardOnFirstOrderCents: 1000,
    invitedCount: 2,
    rewardedCount: 1,
    pendingRewardCents: 1000,
    totalEarnedCents: 1500,
    records: [
      {
        id: "ref-seed-1",
        inviteeName: "王同学",
        status: "rewarded",
        rewardCents: 1500,
        createdAt: "2025-05-12T10:00:00.000Z",
        rewardedAt: "2025-05-20T14:00:00.000Z",
      },
      {
        id: "ref-seed-2",
        inviteeName: "陈同学",
        status: "first_order",
        rewardCents: 500,
        createdAt: "2025-06-01T09:00:00.000Z",
      },
    ],
  });
});

routerAdd("GET", "/api/nuanban/student/settlements", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "student");
  if (!rc.ok) return e.json(rc.code, rc.body);
  if (!e.auth) return e.json(401, { message: "需要登录" });
  return e.json(200, {
    list: [
      { id: "stl-2025-04", period: "2025-04", amountCents: 24800, status: "paid", paidAt: "2025-05-05" },
      { id: "stl-2025-05", period: "2025-05", amountCents: 28500, status: "paid", paidAt: "2025-06-01" },
      { id: "stl-2025-06", period: "2025-06", amountCents: 35200, status: "pending" },
    ],
  });
});

routerAdd("GET", "/api/nuanban/student/withdrawal", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  try {
    const rc = nb.assertActiveRoleHeader(e, "student");
    if (!rc.ok) return e.json(rc.code, rc.body);
    if (!e.auth) return e.json(401, { message: "需要登录" });
    return e.json(200, nb.studentWithdrawalOverview(e.auth.id));
  } catch (err) {
    return e.json(400, { message: String(err && err.message ? err.message : err) });
  }
});

routerAdd("POST", "/api/nuanban/student/withdrawal", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "student");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  let body = {};
  try {
    body = JSON.parse(toString(e.request.body));
  } catch (_) {}
  const amountCents = parseInt(body.amountCents, 10) || 0;
  const channel = body.channel === "bank" ? "bank" : "wechat";
  if (amountCents < 1000) return e.json(400, { message: "提现金额至少 ¥10.00" });
  seedPaymentAccountDemoForUser(auth, "student");
  const payAcct = paymentAccountDemoDto(auth.id, "student");
  if (!payAcct.configured) {
    return e.json(400, { message: "请先绑定收款账户" });
  }
  const overview = nb.studentWithdrawalOverview(auth.id);
  if (amountCents > overview.availableCents) {
    return e.json(400, { message: "可提现余额不足" });
  }
  const wdStore = nb.studentWithdrawalsMap();
  if (!wdStore[auth.id]) wdStore[auth.id] = [];
  const now = new Date().toISOString();
  const instant = channel === "wechat";
  wdStore[auth.id].unshift({
    id: "wd-" + Date.now(),
    amountCents: amountCents,
    channel: channel,
    channelLabel: channel === "wechat" ? "微信零钱 · 尾号 8826" : "建设银行 · 尾号 6688",
    status: instant ? "completed" : "pending",
    createdAt: now,
    completedAt: instant ? now : undefined,
  });
  return e.json(200, nb.studentWithdrawalOverview(auth.id));
});

routerAdd("GET", "/api/nuanban/platform/funds/overview", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  return e.json(200, nb.adminFundOverview());
});

routerAdd("GET", "/api/nuanban/platform/funds/topups", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var collected = nb.adminFundCollectWallet();
  return e.json(200, { list: collected.topups });
});

routerAdd("GET", "/api/nuanban/platform/funds/payments", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var collected = nb.adminFundCollectWallet();
  return e.json(200, { list: collected.payments });
});

routerAdd("GET", "/api/nuanban/platform/funds/withdrawals", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var list = nb.adminFundWithdrawalsList();
  var status = "";
  try {
    status = e.request.url.query().get("status") || "";
  } catch (_) {}
  if (status) list = list.filter(function (w) { return w.status === status; });
  return e.json(200, { list: list });
});

routerAdd("POST", "/api/nuanban/platform/funds/withdrawals/{id}/approve", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var id = e.request.pathValue("id");
  var record = nb.adminApproveWithdrawal(id);
  if (!record) return e.json(400, { message: "提现记录不存在或已处理" });
  return e.json(200, { ok: true, record: record });
});

routerAdd("POST", "/api/nuanban/platform/funds/withdrawals/{id}/reject", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var id = e.request.pathValue("id");
  var body = {};
  try {
    body = JSON.parse(toString(e.request.body));
  } catch (_) {}
  var record = nb.adminRejectWithdrawal(id, body.reason || "");
  if (!record) return e.json(400, { message: "提现记录不存在或已处理" });
  return e.json(200, { ok: true, record: record });
});

routerAdd("POST", "/api/nuanban/platform/funds/reconcile", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var body = {};
  try {
    body = JSON.parse(toString(e.request.body));
  } catch (_) {}
  var recordId = body.recordId || "";
  if (!recordId) return e.json(400, { message: "缺少 recordId" });
  return e.json(200, nb.adminMarkReconciled(recordId));
});

routerAdd("GET", "/api/nuanban/elder/service-logs", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "elder");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const elderId = nb.elderProfileIdForUser(auth.id);
  if (!elderId) return e.json(200, { list: [] });
  const records = $app.findRecordsByFilter(
    "orders",
    'elder = {:eid} && status = "completed"',
    "-scheduled_at",
    50,
    0,
    { eid: elderId }
  );
  const summaries = [
    "陪老人读报，情绪稳定",
    "完成康复操，血压正常",
    "陪同散步约 1km",
    "用药提醒已执行",
    "棋牌陪伴，兴致良好",
  ];
  const list = [];
  for (let i = 0; i < records.length; i++) {
    const o = records[i];
    const svc = nb.serviceInfoById(o.getString("service_item"));
    list.push({
      id: "log-" + o.id,
      orderId: o.id,
      elderId: o.getString("elder"),
      elderName: nb.elderNameById(o.getString("elder")),
      serviceName: svc.name,
      summary: summaries[i % summaries.length],
      createdAt: o.getString("scheduled_at"),
    });
  }
  return e.json(200, { list: list });
});

routerAdd("GET", "/api/nuanban/family/service-logs", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const records = $app.findRecordsByFilter(
    "orders",
    'family_user = {:uid} && status = "completed"',
    "-scheduled_at",
    50,
    0,
    { uid: auth.id }
  );
  const summaries = [
    "陪老人读报，情绪稳定",
    "完成康复操，血压正常",
    "陪同散步约 1km",
    "用药提醒已执行",
    "棋牌陪伴，兴致良好",
  ];
  const list = [];
  for (let i = 0; i < records.length; i++) {
    const o = records[i];
    const svc = nb.serviceInfoById(o.getString("service_item"));
    list.push({
      id: "log-" + o.id,
      orderId: o.id,
      elderId: o.getString("elder"),
      elderName: nb.elderNameById(o.getString("elder")),
      serviceName: svc.name,
      summary: summaries[i % summaries.length],
      createdAt: o.getString("scheduled_at"),
    });
  }
  return e.json(200, { list: list });
});

routerAdd("GET", "/api/nuanban/family/packages", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  return e.json(200, {
    list: [
      { id: "pkg-basic", name: "基础陪护包", desc: "每月 4 次聊天陪伴", priceYuan: 199, sessionsPerMonth: 4 },
      { id: "pkg-rehab", name: "康复关爱包", desc: "每月 2 次康复协助 + 2 次生活陪护", priceYuan: 399, sessionsPerMonth: 4 },
      { id: "pkg-family", name: "全家安心包", desc: "含外出陪同审批优先通道", priceYuan: 599, sessionsPerMonth: 6 },
    ],
  });
});

routerAdd("POST", "/api/nuanban/family/packages/purchase", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const rc = nb.assertActiveRoleHeader(e, "family");
  if (!rc.ok) return e.json(rc.code, rc.body);
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const raw = toString(e.request.body);
  const body = raw ? JSON.parse(raw) : {};
  const pkgId = body.packageId || "pkg-basic";
  const prices = { "pkg-basic": 19900, "pkg-rehab": 39900, "pkg-family": 59900 };
  const names = { "pkg-basic": "基础陪护包", "pkg-rehab": "康复关爱包", "pkg-family": "全家安心包" };
  const amount = prices[pkgId] || 19900;
  const col = $app.findCollectionByNameOrId("orders");
  const order = new Record(col);
  order.set("status", "pending_payment");
  order.set("payment_status", "unpaid");
  order.set("amount_cents", amount);
  order.set("family_user", auth.id);
  order.set("scheduled_at", new Date(Date.now() + 86400000 * 3).toISOString());
  try {
    const elders = $app.findRecordsByFilter("elders", "enabled = true", "", 1, 0);
    if (elders.length > 0) order.set("elder", elders[0].id);
  } catch (_) {}
  try {
    const items = $app.findRecordsByFilter("service_items", 'name != ""', "", 1, 0);
    if (items.length > 0) order.set("service_item", items[0].id);
  } catch (_) {}
  $app.save(order);
  return e.json(200, {
    ok: true,
    orderId: order.id,
    status: "pending_payment",
    packageName: names[pkgId] || "服务包",
  });
});

routerAdd("GET", "/api/nuanban/platform/activity", function (e) {
  const summaries = [
    { kind: "order_confirmed", title: "服务已确认", detail: "演示归档记录" },
    { kind: "order_accepted", title: "学生接单", detail: "待签到服务" },
    { kind: "order_paid", title: "家属已支付", detail: "储值卡扣款" },
    { kind: "outdoor_approved", title: "外出已批准", detail: "陪同散步" },
  ];
  const list = [];
  for (let i = 0; i < summaries.length; i++) {
    const s = summaries[i];
    list.push({
      id: "act-seed-" + (i + 1),
      kind: s.kind,
      title: s.title,
      detail: s.detail,
      createdAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    });
  }
  return e.json(200, { list: list });
});

routerAdd("POST", "/api/nuanban/platform/seed-scenario", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  const col = $app.findCollectionByNameOrId("orders");
  const order = new Record(col);
  order.set("status", "outdoor_pending");
  order.set("payment_status", "paid");
  order.set("amount_cents", 6500);
  order.set("family_user", e.auth ? e.auth.id : "");
  order.set("scheduled_at", new Date(Date.now() + 86400000).toISOString());
  try {
    const elders = $app.findRecordsByFilter("elders", "enabled = true", "", 1, 0);
    if (elders.length > 0) order.set("elder", elders[0].id);
    const items = $app.findRecordsByFilter("service_items", 'name != ""', "", 1, 0);
    if (items.length > 0) order.set("service_item", items[0].id);
  } catch (_) {}
  $app.save(order);
  return e.json(200, {
    ok: true,
    orderId: order.id,
    elderName: "张奶奶",
    serviceName: "陪同散步",
  });
});

/** 平台运营看板：撮合漏斗与核心指标（演示） */
routerAdd("GET", "/api/nuanban/platform/students", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var q = e.request.url.query();
  var page = parseInt(q.get("page") || "1", 10);
  var pageSize = parseInt(q.get("pageSize") || "50", 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(pageSize) || pageSize < 1) pageSize = 50;
  if (pageSize > 200) pageSize = 200;
  var offset = (page - 1) * pageSize;
  var statusFilter = String(q.get("status") || "").trim();
  var filter = 'role = "student"';
  if (statusFilter === "pending" || statusFilter === "active" || statusFilter === "rejected") {
    filter += ' && status = "' + statusFilter + '"';
  }
  var list = [];
  var total = 0;
  try {
    total = $app.findRecordsByFilter("user_roles", filter, "", 50000, 0).length;
    var roleRecords = $app.findRecordsByFilter(
      "user_roles",
      filter,
      "",
      pageSize,
      offset
    );
    for (var i = 0; i < roleRecords.length; i++) {
      var r = roleRecords[i];
      var uid = r.getString("user");
      var user = null;
      try {
        user = $app.findRecordById("users", uid);
      } catch (_) {}
      var schoolName = "";
      var schoolId = nb.safeRecordString(r, "school", "");
      if (schoolId) {
        try {
          var s = $app.findRecordById("school_dict", schoolId);
          schoolName = nb.safeRecordString(s, "name", "");
        } catch (_) {}
      }
      var displayName = nb.safeRecordString(r, "display_name", "");
      list.push({
        userId: uid,
        displayName: displayName || (user ? user.getString("name") : "学生"),
        nickname: user ? user.getString("name") : displayName,
        email: user ? user.getString("email") : "",
        schoolName: schoolName,
        status: nb.safeRecordString(r, "status", "active"),
        cartoonAvatarId: nb.safeRecordString(r, "cartoon_avatar_id", ""),
        avatarUrl: user ? nb.userAvatarUrlForClient(user, e) : "",
        verificationPhotoUrl: nb.roleFileUrlForClient(r, "verification_photo", e),
        gender: nb.safeRecordString(r, "gender", "未填"),
        major: "护理学",
        grade: "大三",
        phone: "138****1234",
      });
    }
  } catch (err) {
    return e.json(400, { message: String(err && err.message ? err.message : err), list: [], total: 0 });
  }
  return e.json(200, {
    list: list,
    total: total,
    page: page,
    pageSize: pageSize,
    hasMore: offset + list.length < total,
  });
});

routerAdd("POST", "/api/nuanban/platform/students/{userId}/status", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var uid = e.request.pathValue("userId");
  var raw = toString(e.request.body);
  var body = raw ? JSON.parse(raw) : {};
  var status = String(body.status || "").trim();
  if (status !== "active" && status !== "rejected" && status !== "pending") {
    return e.json(400, { message: "status 须为 active / rejected / pending" });
  }
  var roles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "student"',
    "",
    5,
    0,
    { uid: uid }
  );
  if (roles.length === 0) {
    return e.json(404, { message: "学生角色不存在" });
  }
  roles[0].set("status", status);
  $app.save(roles[0]);
  return e.json(200, { ok: true, userId: uid, status: status });
});

routerAdd("GET", "/api/nuanban/platform/sos/active", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var list = [];
  try {
    var records = $app.findRecordsByFilter(
      "sos_alerts",
      'status = "active"',
      "-created",
      30,
      0
    );
    for (var i = 0; i < records.length; i++) {
      list.push(nb.sosToDto(records[i]));
    }
  } catch (_) {}
  return e.json(200, { list: list });
});

routerAdd("GET", "/api/nuanban/platform/overview", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  let pending = 0;
  let pendingPay = 0;
  let inSvc = 0;
  let done = 0;
  let elders = 0;
  let walletPaidCents = 0;
  let studentsPending = 0;
  let studentsActiveCount = 0;
  let pendingConfirm = 0;
  let sosActive = 0;
  let pendingWithdrawals = 0;
  try {
    pending = $app.findRecordsByFilter("orders", 'status = "pending_accept"', "", 200, 0).length;
    pendingPay = $app.findRecordsByFilter("orders", 'status = "pending_payment"', "", 200, 0).length;
    inSvc = $app.findRecordsByFilter("orders", 'status = "in_service"', "", 200, 0).length;
    done = $app.findRecordsByFilter("orders", 'status = "completed"', "", 200, 0).length;
    pendingConfirm = $app.findRecordsByFilter("orders", 'status = "pending_confirm"', "", 200, 0).length;
    elders = $app.findRecordsByFilter("elders", "enabled = true", "", 200, 0).length;
    studentsPending = $app.findRecordsByFilter(
      "user_roles",
      'role = "student" && status = "pending"',
      "",
      50000,
      0
    ).length;
    studentsActiveCount = $app.findRecordsByFilter(
      "user_roles",
      'role = "student" && status = "active"',
      "",
      50000,
      0
    ).length;
    try {
      sosActive = $app.findRecordsByFilter("sos_alerts", 'status = "active"', "", 50, 0).length;
    } catch (_) {}
    try {
      pendingWithdrawals = $app.findRecordsByFilter(
        "withdrawals",
        'status = "pending"',
        "",
        200,
        0
      ).length;
    } catch (_) {}
    var paidOrders = $app.findRecordsByFilter("orders", 'payment_status = "paid"', "", 500, 0);
    for (var pi = 0; pi < paidOrders.length; pi++) {
      walletPaidCents += paidOrders[pi].getInt("amount_cents") || 0;
    }
  } catch (_) {}
  return e.json(200, {
    mission: "让陪伴有温度，让勤工有意义",
    updatedAt: new Date().toISOString(),
    eldersTotal: elders,
    studentsActive: studentsActiveCount,
    studentsTotal: studentsActiveCount + studentsPending,
    ordersPendingAccept: pending,
    ordersPendingPayment: pendingPay,
    ordersPendingConfirm: pendingConfirm,
    ordersInService: inSvc,
    ordersCompleted: done,
    studentsPendingCount: studentsPending,
    sosActiveCount: sosActive,
    pendingWithdrawalCount: pendingWithdrawals,
    walletPaidTotalCents: walletPaidCents,
    walletPaidTotalYuan: (walletPaidCents / 100).toFixed(2),
    serviceLogCount: done,
    caregiversNearby: studentsActiveCount,
    eldersNearby: elders,
    todayMatches: inSvc + Math.min(done, 12),
    matchSuccessRatePct: 94,
    matchingPaths: [
      {
        id: "org_dispatch",
        label: "机构派单",
        description: "平台/养老院将订单指定给同学",
        status: "demo",
        metric: "待派单",
        metricValue: pending,
      },
      {
        id: "elder_find_student",
        label: "老人找同学",
        description: "老人按距离浏览大学生志愿者并预约",
        status: "live",
        metric: "附近同学",
        metricValue: 8,
      },
      {
        id: "student_find_elder",
        label: "同学找需求",
        description: "学生看待接单池或附近老人并接单",
        status: "live",
        metric: "附近老人",
        metricValue: elders,
      },
    ],
    coreCompletionPct: 88,
    auditStatus: "PASS",
    demoUrl: nb.h5AppBaseUrl(e) + "/#/pages/common/login",
  });
});

routerAdd("GET", "/api/nuanban/orders/{id}/messages", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  var roleHdr = e.request.header.get("X-Active-Role") || "";
  var orderId = e.request.pathValue("id");
  var order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (!nb.orderChatCanAccess(e.auth.id, roleHdr, order)) {
    return e.json(403, { message: "无权查看该订单沟通" });
  }
  return e.json(200, {
    list: nb.orderMessagesDto(orderId, e.auth.id),
    threadOpen: nb.orderChatThreadOpen(order.getString("status")),
  });
});

routerAdd("POST", "/api/nuanban/orders/{id}/messages", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  if (!e.auth) return e.json(401, { message: "需要登录" });
  var roleHdr = e.request.header.get("X-Active-Role") || "";
  var orderId = e.request.pathValue("id");
  var order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  if (!nb.orderChatCanAccess(e.auth.id, roleHdr, order)) {
    return e.json(403, { message: "无权发送消息" });
  }
  if (!nb.orderChatThreadOpen(order.getString("status"))) {
    return e.json(400, { message: "本单沟通通道已关闭" });
  }
  var raw = toString(e.request.body);
  var body = raw ? JSON.parse(raw) : {};
  var msgType = String(body.type || "text");
  var msg;
  try {
    if (msgType === "voice") {
      var audioB64 = String(body.audioBase64 || "").trim();
      if (!audioB64) return e.json(400, { message: "语音数据不能为空" });
      var dur = parseInt(String(body.durationSec || "0"), 10);
      if (!dur || dur < 1) return e.json(400, { message: "语音时长无效" });
      msg = nb.orderMessagePushVoice(
        orderId,
        e.auth.id,
        roleHdr,
        audioB64,
        dur,
        String(body.mimeType || "audio/mpeg")
      );
    } else {
      var text = String(body.body || "").trim();
      if (!text) return e.json(400, { message: "消息不能为空" });
      msg = nb.orderMessagePushText(orderId, e.auth.id, roleHdr, text);
    }
  } catch (err) {
    return e.json(400, { message: String(err.message || err) });
  }
  var dto = nb.orderMessageToDto(orderId, msg, e.auth.id);
  dto.mine = true;
  return e.json(200, { ok: true, message: dto });
});


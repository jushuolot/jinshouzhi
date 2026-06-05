/// V1 custom routes: wx-login stub, order accept/reject, family pay, outdoor approve

function elderNameById(id) {
  try {
    return $app.findRecordById("elders", id).getString("name");
  } catch (_) {
    return "老人";
  }
}

function serviceInfoById(id) {
  try {
    const s = $app.findRecordById("service_items", id);
    return {
      name: s.getString("name"),
      durationMinutes: s.getInt("duration_minutes") || 0,
      requiresOutdoor: s.getBool("requires_outdoor_approval"),
    };
  } catch (_) {
    return { name: "陪护服务", durationMinutes: 0, requiresOutdoor: false };
  }
}

function orderToStudentDto(o) {
  const svc = serviceInfoById(o.getString("service_item"));
  return {
    id: o.id,
    elderId: o.getString("elder"),
    elderName: elderNameById(o.getString("elder")),
    serviceName: svc.name,
    durationMinutes: svc.durationMinutes,
    amountCents: o.getInt("amount_cents"),
    scheduledAt: o.getString("scheduled_at"),
    status: o.getString("status"),
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

routerAdd("GET", "/api/nuanban/ping", (e) => {
  return e.json(200, { ok: true, hooks: true, hasToString: typeof toString });
});

routerAdd("POST", "/api/nuanban/body", (e) => {
  const raw = toString(e.request.body);
  const obj = JSON.parse(raw);
  return e.json(200, { obj: obj });
});

routerAdd("GET", "/api/nuanban/debug/roles", (e) => {
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

routerAdd("POST", "/api/nuanban/wx-login", (e) => {
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
routerAdd("POST", "/api/nuanban/dev-login", (e) => {
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

  return e.json(200, {
    token: user.newAuthToken(),
    user: {
      id: user.id,
      nickname: user.getString("name") || user.getString("email"),
      email: user.getString("email"),
    },
    roles: roles,
    activeRole: activeRole,
  });
});

routerAdd("GET", "/api/nuanban/auth/me", (e) => {
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
  return e.json(200, {
    user: { id: auth.id, nickname: auth.getString("name") },
    roles: roles,
  });
});

routerAdd("POST", "/api/nuanban/auth/register", (e) => {
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

routerAdd("GET", "/api/nuanban/elder/caregivers/nearby", (e) => {
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

routerAdd("POST", "/api/nuanban/elder/orders", (e) => {
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

routerAdd("POST", "/api/nuanban/student/order-requests/{id}/accept", (e) => {
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

routerAdd("POST", "/api/nuanban/student/order-requests/{id}/reject", (e) => {
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

routerAdd("POST", "/api/nuanban/family/orders/{id}/pay", (e) => {
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

routerAdd("POST", "/api/nuanban/family/outdoor/{id}/approve", (e) => {
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

routerAdd("GET", "/api/nuanban/student/orders/pending", (e) => {
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
      list.push(orderToStudentDto(records[i]));
    }
    return e.json(200, { list: list });
  } catch (err) {
    return e.json(200, { ok: false, error: "" + err });
  }
});

routerAdd("GET", "/api/nuanban/student/profile", (e) => {
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
    displayName = r.getString("display_name") || "";
    const schoolId = r.getString("school");
    if (schoolId) {
      try {
        const s = $app.findRecordById("school_dict", schoolId);
        schoolName = s.getString("name");
      } catch (_) {}
    }
  }
  return e.json(200, {
    nickname: auth.getString("name") || displayName || "学生",
    email: auth.getString("email"),
    schoolName: schoolName,
    displayName: displayName,
  });
});

routerAdd("GET", "/api/nuanban/student/stats", (e) => {
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

routerAdd("GET", "/api/nuanban/family/stats", (e) => {
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
    outdoorPendingCount: outdoorPending,
    sosPendingCount: sosPending,
    paidTotalCents: paidCents,
    paidTotalYuan: (paidCents / 100).toFixed(2),
  });
});

routerAdd("GET", "/api/nuanban/elder/stats", (e) => {
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

routerAdd("GET", "/api/nuanban/student/orders/active", (e) => {
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
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
    list.push(orderToStudentDto(records[i]));
  }
  return e.json(200, { list: list });
});

routerAdd("GET", "/api/nuanban/student/orders/{id}", (e) => {
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  return e.json(200, orderToStudentDto(order));
});

routerAdd("POST", "/api/nuanban/student/orders/{id}/start", (e) => {
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

routerAdd("POST", "/api/nuanban/student/orders/{id}/complete", (e) => {
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
  order.set("status", "completed");
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
    schs[0].set("status", "completed");
    $app.save(schs[0]);
  }
  return e.json(200, { ok: true, status: "completed" });
});

routerAdd("GET", "/api/nuanban/student/income", (e) => {
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthPrefix = year + "-" + (month < 10 ? "0" + month : "" + month);
  const records = $app.findRecordsByFilter(
    "orders",
    'student_user = {:uid} && status = "completed"',
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
    const svc = serviceInfoById(o.getString("service_item"));
    list.push({
      id: o.id,
      elderName: elderNameById(o.getString("elder")),
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

routerAdd("GET", "/api/nuanban/student/schedules", (e) => {
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
    let elderName = elderNameById(sch.getString("elder"));
    try {
      const order = $app.findRecordById("orders", sch.getString("order"));
      orderId = order.id;
      serviceName = serviceInfoById(order.getString("service_item")).name;
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

routerAdd("POST", "/api/nuanban/elder/sos", (e) => {
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

routerAdd("GET", "/api/nuanban/family/sos/active", (e) => {
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
    list.push(sosToDto(records[i]));
  }
  return e.json(200, { list: list });
});

routerAdd("POST", "/api/nuanban/family/sos/{id}/ack", (e) => {
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

routerAdd("GET", "/api/nuanban/student/sos/active", (e) => {
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
    list.push(sosToDto(records[i]));
  }
  return e.json(200, { list: list });
});

routerAdd("POST", "/api/nuanban/student/sos/{id}/ack", (e) => {
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

routerAdd("POST", "/api/nuanban/student/orders/{id}/checkin", (e) => {
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
      if (elat && elng && haversineM(lat, lng, elat, elng) > 500) {
        return e.json(400, { message: "未进入服务点 500m 围栏" });
      }
    } catch (_) {}
  }
  order.set("status", "in_service");
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

routerAdd("GET", "/api/nuanban/student/service-logs", (e) => {
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
    const svc = serviceInfoById(o.getString("service_item"));
    list.push({
      id: "log-" + o.id,
      orderId: o.id,
      elderId: o.getString("elder"),
      elderName: elderNameById(o.getString("elder")),
      serviceName: svc.name,
      summary: summaries[i % summaries.length],
      createdAt: o.getString("scheduled_at"),
    });
  }
  return e.json(200, { list: list });
});

routerAdd("GET", "/api/nuanban/family/orders/{id}", (e) => {
  const auth = e.auth;
  if (!auth) return e.json(401, { message: "需要登录" });
  const orderId = e.request.pathValue("id");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch (_) {
    return e.json(404, { message: "订单不存在" });
  }
  return e.json(200, orderToFamilyDto(order));
});

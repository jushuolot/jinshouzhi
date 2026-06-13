/// 一键写入演示数据：POST /api/nuanban/seed-demo?key=nuanban_dev_seed
/// 可重复执行（按名称/邮箱去重，不重复创建）
/// 注意：PocketBase hooks 路由回调内无法访问顶层 var/const，常量与校验写在 handler 内。

routerAdd("POST", "/api/nuanban/seed-demo", (e) => {
  const SEED_KEY = "nuanban_dev_seed";
  const DEV_PASS = "nuanban_dev_2025";
  const q = e.request.url.query();
  if (q.get("key") !== SEED_KEY) {
    return e.json(400, { message: "缺少或错误的 key 参数" });
  }

  let stats;
  try {
  stats = { users: 0, roles: 0, schools: 0, orgs: 0, elders: 0, orders: 0, serviceItems: 0, bindings: 0 };

  // school_dict（与 demo-rich-data DEMO_SCHOOLS 对齐）
  const demoSchoolNames = ["示范大学", "城东师范学院", "医科大学"];
  const schoolsByName = {};
  for (let si = 0; si < demoSchoolNames.length; si++) {
    const sn = demoSchoolNames[si];
    const existingSchool = $app.findRecordsByFilter(
      "school_dict",
      "name = {:n}",
      "",
      1,
      0,
      { n: sn }
    );
    if (existingSchool.length > 0) {
      schoolsByName[sn] = existingSchool[0];
    } else {
      const schoolCol = $app.findCollectionByNameOrId("school_dict");
      const srec = new Record(schoolCol);
      srec.set("name", sn);
      srec.set("sort_order", si + 1);
      srec.set("enabled", true);
      $app.save(srec);
      schoolsByName[sn] = srec;
      stats.schools += 1;
    }
  }
  const school = schoolsByName["示范大学"];
  const schoolEast = schoolsByName["城东师范学院"];

  function findOrCreateUserByEmail(email, name) {
    const rows = $app.findRecordsByFilter(
      "users",
      "email = {:e}",
      "",
      1,
      0,
      { e: email }
    );
    if (rows.length > 0) return rows[0];
    const usersCol = $app.findCollectionByNameOrId("users");
    const u = new Record(usersCol);
    u.set("email", email);
    u.setPassword(DEV_PASS);
    u.set("verified", true);
    u.set("name", name);
    $app.save(u);
    stats.users += 1;
    return u;
  }

  function findOrCreateRole(userId, role, extra) {
    const rows = $app.findRecordsByFilter(
      "user_roles",
      "user = {:uid} && role = {:r}",
      "",
      1,
      0,
      { uid: userId, r: role }
    );
    if (rows.length > 0) {
      const existing = rows[0];
      if (extra) {
        const keys = Object.keys(extra);
        for (let i = 0; i < keys.length; i++) {
          existing.set(keys[i], extra[keys[i]]);
        }
        $app.save(existing);
      }
      return existing;
    }
    const rolesCol = $app.findCollectionByNameOrId("user_roles");
    const rec = new Record(rolesCol);
    rec.set("user", userId);
    rec.set("role", role);
    rec.set("status", "active");
    if (extra) {
      const keys = Object.keys(extra);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        rec.set(k, extra[k]);
      }
    }
    $app.save(rec);
    stats.roles += 1;
    return rec;
  }

  function findOrCreateOrg(name) {
    const rows = $app.findRecordsByFilter(
      "organizations",
      "name = {:n}",
      "",
      1,
      0,
      { n: name }
    );
    if (rows.length > 0) return rows[0];
    const col = $app.findCollectionByNameOrId("organizations");
    const rec = new Record(col);
    rec.set("name", name);
    rec.set("latitude", 31.23);
    rec.set("longitude", 121.47);
    rec.set("enabled", true);
    $app.save(rec);
    stats.orgs += 1;
    return rec;
  }

  function applyElderDemoFields(rec, elderName) {
    if (elderName === "张奶奶") {
      rec.set("age", 78);
      rec.set("district", "浦东新区");
      rec.set("health_status", "总体良好");
      rec.set("mobility", "行动便利");
      rec.set("living_situation", "与子女同住");
      rec.set("hobbies", ["聊天", "散步"]);
      rec.set("service_preferences", ["陪伴聊天"]);
      rec.set("preferred_visit_times", ["工作日下午 14:00–17:00"]);
      rec.set("emergency_contact_name", "家属");
      rec.set("emergency_contact_relation", "女儿");
      rec.set("emergency_contact_phone", "138****9999");
    } else if (elderName === "李爷爷") {
      rec.set("age", 82);
      rec.set("district", "浦东新区");
      rec.set("health_status", "血压需关注");
      rec.set("mobility", "需搀扶");
      rec.set("living_situation", "机构养老");
      rec.set("hobbies", ["听戏", "下象棋"]);
      rec.set("service_preferences", ["康复协助", "陪诊"]);
      rec.set("preferred_visit_times", ["周末上午 9:00–11:00"]);
      rec.set("emergency_contact_name", "李先生");
      rec.set("emergency_contact_relation", "儿子");
      rec.set("emergency_contact_phone", "139****8888");
    }
  }

  function findOrCreateElder(orgId, name, lat, lng, gender) {
    const rows = $app.findRecordsByFilter(
      "elders",
      "name = {:n}",
      "",
      1,
      0,
      { n: name }
    );
    if (rows.length > 0) {
      const existing = rows[0];
      existing.set("org", orgId);
      existing.set("latitude", lat);
      existing.set("longitude", lng);
      existing.set("enabled", true);
      if (gender) existing.set("gender", gender);
      applyElderDemoFields(existing, name);
      $app.save(existing);
      return existing;
    }
    const col = $app.findCollectionByNameOrId("elders");
    const rec = new Record(col);
    rec.set("org", orgId);
    rec.set("name", name);
    rec.set("latitude", lat);
    rec.set("longitude", lng);
    rec.set("enabled", true);
    if (gender) rec.set("gender", gender);
    applyElderDemoFields(rec, name);
    $app.save(rec);
    stats.elders += 1;
    return rec;
  }

  function findOrCreateServiceCategory(name, sortOrder) {
    const rows = $app.findRecordsByFilter(
      "service_categories",
      "name = {:n}",
      "",
      1,
      0,
      { n: name }
    );
    if (rows.length > 0) return rows[0];
    const col = $app.findCollectionByNameOrId("service_categories");
    const rec = new Record(col);
    rec.set("name", name);
    rec.set("sort_order", sortOrder || 1);
    $app.save(rec);
    return rec;
  }

  function findOrCreateServiceItem(categoryId, name, priceCents, extra) {
    const rows = $app.findRecordsByFilter(
      "service_items",
      "name = {:n}",
      "",
      1,
      0,
      { n: name }
    );
    if (rows.length > 0) {
      const existing = rows[0];
      if (extra) {
        if (extra.durationMinutes != null) existing.set("duration_minutes", extra.durationMinutes);
        if (extra.requiresOutdoor != null) existing.set("requires_outdoor_approval", extra.requiresOutdoor);
        existing.set("enabled", true);
        $app.save(existing);
      }
      return existing;
    }
    const col = $app.findCollectionByNameOrId("service_items");
    const rec = new Record(col);
    rec.set("category", categoryId);
    rec.set("name", name);
    rec.set("price_cents", priceCents);
    rec.set("duration_minutes", (extra && extra.durationMinutes) || 60);
    rec.set("requires_outdoor_approval", !!(extra && extra.requiresOutdoor));
    rec.set("enabled", true);
    $app.save(rec);
    stats.serviceItems += 1;
    return rec;
  }

  function findOrCreateOrder(elderId, serviceItemId, status, extra) {
    const rows = $app.findRecordsByFilter(
      "orders",
      "elder = {:eid} && status = {:st}",
      "",
      1,
      0,
      { eid: elderId, st: status }
    );
    if (rows.length > 0) return rows[0];
    const col = $app.findCollectionByNameOrId("orders");
    const rec = new Record(col);
    rec.set("elder", elderId);
    rec.set("service_item", serviceItemId);
    rec.set("source", "family");
    rec.set("status", status);
    rec.set("amount_cents", extra.amountCents || 5000);
    rec.set("payment_status", extra.paymentStatus || "unpaid");
    if (extra.familyUserId) rec.set("family_user", extra.familyUserId);
    if (extra.studentUserId) rec.set("student_user", extra.studentUserId);
    if (extra.scheduledAt) rec.set("scheduled_at", extra.scheduledAt);
    $app.save(rec);
    stats.orders += 1;
    return rec;
  }

  function seedDate(daysOffset) {
    const d = new Date(Date.now() + daysOffset * 86400000);
    return d.toISOString().slice(0, 10);
  }

  function findOrCreateFamilyBinding(familyUserId, elderId) {
    const rows = $app.findRecordsByFilter(
      "family_elder_bindings",
      "family_user = {:f} && elder = {:e}",
      "",
      1,
      0,
      { f: familyUserId, e: elderId }
    );
    if (rows.length > 0) return rows[0];
    const col = $app.findCollectionByNameOrId("family_elder_bindings");
    const rec = new Record(col);
    rec.set("family_user", familyUserId);
    rec.set("elder", elderId);
    rec.set("relation_label", "家属");
    rec.set("is_primary_payer", true);
    $app.save(rec);
    stats.bindings += 1;
    return rec;
  }

  function findUserByEmail(email) {
    const rows = $app.findRecordsByFilter(
      "users",
      "email = {:e}",
      "",
      1,
      0,
      { e: email }
    );
    return rows.length > 0 ? rows[0] : null;
  }

  const uFamily = findOrCreateUserByEmail("family1@test.nuanban.dev", "家属1");
  const uMulti = findOrCreateUserByEmail("multi1@test.nuanban.dev", "多角色");
  const uStudent135 = findUserByEmail("m13500000001@test.nuanban.dev");

  const org = findOrCreateOrg("暖伴示范养老院");
  const elderZhang = findOrCreateElder(org.id, "张奶奶", 31.2304, 121.4737, "女");
  const elderLi = findOrCreateElder(org.id, "李爷爷", 31.235, 121.48, "男");

  findOrCreateRole(uFamily.id, "family", { display_name: "家属1" });
  findOrCreateRole(uMulti.id, "student", {
    display_name: "多角色-学生",
    school: school.id,
    gender: "女",
  });
  findOrCreateRole(uMulti.id, "family", { display_name: "多角色-家属" });
  findOrCreateRole(uMulti.id, "elder", {
    display_name: "多角色-老人",
    elder_profile: elderLi.id,
  });

  findOrCreateFamilyBinding(uFamily.id, elderZhang.id);
  findOrCreateFamilyBinding(uFamily.id, elderLi.id);

  const catCompanion = findOrCreateServiceCategory("陪伴聊天", 1);
  const catCare = findOrCreateServiceCategory("生活陪护", 2);
  const catRehab = findOrCreateServiceCategory("康复协助", 3);
  const catOutdoor = findOrCreateServiceCategory("外出陪同", 4);

  const svcChat = findOrCreateServiceItem(catCompanion.id, "聊天陪伴", 5000, { durationMinutes: 60 });
  const svcRead = findOrCreateServiceItem(catCompanion.id, "读报陪聊", 4000, { durationMinutes: 45 });
  const svcChess = findOrCreateServiceItem(catCompanion.id, "棋牌陪伴", 6000, { durationMinutes: 90 });
  const svcLife = findOrCreateServiceItem(catCare.id, "生活陪护", 7000, { durationMinutes: 60 });
  const svcMed = findOrCreateServiceItem(catCare.id, "用药提醒", 3500, { durationMinutes: 30 });
  const svcRehab = findOrCreateServiceItem(catRehab.id, "辅助康复操", 8000, { durationMinutes: 60 });
  const svcFinger = findOrCreateServiceItem(catRehab.id, "手指操陪练", 4500, { durationMinutes: 30 });
  const svcWalk = findOrCreateServiceItem(catOutdoor.id, "陪同散步", 6500, { durationMinutes: 60, requiresOutdoor: true });
  const svcHospital = findOrCreateServiceItem(catOutdoor.id, "陪同就医", 12000, { durationMinutes: 120, requiresOutdoor: true });
  const svcShop = findOrCreateServiceItem(catOutdoor.id, "超市代购陪同", 8000, { durationMinutes: 90, requiresOutdoor: true });

  findOrCreateOrder(elderZhang.id, svcChat.id, "pending_accept", {
    amountCents: 5000,
    paymentStatus: "paid",
    familyUserId: uFamily.id,
    scheduledAt: seedDate(1),
  });
  if (uStudent135) {
    findOrCreateOrder(elderZhang.id, svcLife.id, "in_service", {
      amountCents: 7000,
      paymentStatus: "paid",
      familyUserId: uFamily.id,
      studentUserId: uStudent135.id,
      scheduledAt: seedDate(0),
    });
  }
  findOrCreateOrder(elderLi.id, svcWalk.id, "pending_payment", {
    amountCents: 6500,
    paymentStatus: "unpaid",
    familyUserId: uFamily.id,
    scheduledAt: seedDate(2),
  });
  if (uStudent135) {
    findOrCreateOrder(elderZhang.id, svcRehab.id, "completed", {
      amountCents: 8000,
      paymentStatus: "paid",
      familyUserId: uFamily.id,
      studentUserId: uStudent135.id,
      scheduledAt: seedDate(-3),
    });
    findOrCreateOrder(elderLi.id, svcLife.id, "completed", {
      amountCents: 7000,
      paymentStatus: "paid",
      familyUserId: uFamily.id,
      studentUserId: uStudent135.id,
      scheduledAt: seedDate(-1),
    });
  }

  return e.json(200, {
    ok: true,
    message: "演示数据已写入（138 学生/老人账号已停用，请用 135 号段）",
    stats: stats,
    accounts: {
      student: ["m13500000001@test.nuanban.dev"],
      family: ["family1@test.nuanban.dev"],
      elder: ["m13500000005@test.nuanban.dev"],
      multi: ["multi1@test.nuanban.dev"],
    },
  });
  } catch (err) {
    return e.json(400, {
      ok: false,
      message: String(err && err.message ? err.message : err),
    });
  }
});

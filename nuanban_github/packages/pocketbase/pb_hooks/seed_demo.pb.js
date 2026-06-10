/// 一键写入演示数据：POST /api/nuanban/seed-demo?key=nuanban_dev_seed
/// 可重复执行（按名称/邮箱去重，不重复创建）

const SEED_KEY = "nuanban_dev_seed";
const DEV_PASS = "nuanban_dev_2025";

var mustSeedKey = function(e) {
  const q = e.request.url.query();
  if (q.get("key") !== SEED_KEY) {
    throw new BadRequestError("缺少或错误的 key 参数");
  }
}

var findOne = function(collection, filter, params) {
  const rows = $app.findRecordsByFilter(collection, filter, "", 1, 0, params || {});
  return rows.length ? rows[0] : null;
}

var findOrCreateBase = function(collection, filter, params, apply) {
  let rec = findOne(collection, filter, params);
  if (rec) return rec;
  const col = $app.findCollectionByNameOrId(collection);
  rec = new Record(col);
  apply(rec);
  $app.save(rec);
  return rec;
}

var findOrCreateUser = function(email, name) {
  const existing = $app.findRecordsByFilter(
    "users",
    "email = {:e}",
    "",
    1,
    0,
    { e: email }
  );
  if (existing.length > 0) {
    return existing[0];
  }
  const col = $app.findCollectionByNameOrId("users");
  const u = new Record(col);
  u.set("email", email);
  u.setRandomPassword();
  u.set("verified", true);
  u.set("name", name);
  $app.saveNoValidate(u);
  return u;
}

var findOrCreateUserRole = function(userId, role, extra) {
  const existing = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = {:role}',
    "",
    1,
    0,
    { uid: userId, role }
  );
  if (existing.length) return existing[0];
  const col = $app.findCollectionByNameOrId("user_roles");
  const r = new Record(col);
  r.set("user", userId);
  r.set("role", role);
  r.set("status", "active");
  if (extra) {
    Object.keys(extra).forEach((k) => r.set(k, extra[k]));
  }
  $app.save(r);
  return r;
}

routerAdd("POST", "/api/nuanban/seed-demo", (e) => {
  try {
    mustSeedKey(e);
  } catch (err) {
    return e.json(400, { message: String(err.message || err) });
  }
  let stats;
  try {
  stats = { users: 0, roles: 0, schools: 0, orgs: 0, elders: 0, orders: 0, serviceItems: 0, bindings: 0 };

  // school_dict
  const existingSchool = $app.findRecordsByFilter(
    "school_dict",
    "name = {:n}",
    "",
    1,
    0,
    { n: "示范大学" }
  );
  let school;
  if (existingSchool.length > 0) {
    school = existingSchool[0];
  } else {
    const schoolCol = $app.findCollectionByNameOrId("school_dict");
    school = new Record(schoolCol);
    school.set("name", "示范大学");
    school.set("sort_order", 1);
    school.set("enabled", true);
    $app.save(school);
  }
  stats.schools += 1;

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

  function findOrCreateElder(orgId, name, lat, lng) {
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

  const uStudent = findOrCreateUserByEmail("student1@test.nuanban.dev", "林同学");
  const uStudent2 = findOrCreateUserByEmail("student2@test.nuanban.dev", "周同学");
  const uStudent3 = findOrCreateUserByEmail("student3@test.nuanban.dev", "待审同学");
  const uFamily = findOrCreateUserByEmail("family1@test.nuanban.dev", "家属1");
  const uElder = findOrCreateUserByEmail("elder1@test.nuanban.dev", "老人1");
  const uMulti = findOrCreateUserByEmail("multi1@test.nuanban.dev", "多角色");

  const org = findOrCreateOrg("暖伴示范养老院");
  const elderZhang = findOrCreateElder(org.id, "张奶奶", 31.2304, 121.4737);
  const elderLi = findOrCreateElder(org.id, "李爷爷", 31.235, 121.48);

  findOrCreateRole(uStudent.id, "student", {
    school: school.id,
    display_name: "林同学",
    latitude: 31.232,
    longitude: 121.475,
  });
  findOrCreateRole(uStudent2.id, "student", {
    school: school.id,
    display_name: "周同学",
    latitude: 31.231,
    longitude: 121.474,
  });
  findOrCreateRole(uStudent3.id, "student", {
    school: school.id,
    display_name: "待审同学",
    status: "pending",
  });
  findOrCreateRole(uFamily.id, "family", { display_name: "家属1" });
  findOrCreateRole(uElder.id, "elder", {
    display_name: "老人1",
    elder_profile: elderZhang.id,
  });
  findOrCreateRole(uMulti.id, "student", { display_name: "多角色-学生", school: school.id });
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
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  });
  findOrCreateOrder(elderZhang.id, svcLife.id, "in_service", {
    amountCents: 7000,
    paymentStatus: "paid",
    familyUserId: uFamily.id,
    studentUserId: uStudent.id,
    scheduledAt: new Date(Date.now() - 3600000).toISOString(),
  });
  findOrCreateOrder(elderLi.id, svcWalk.id, "pending_payment", {
    amountCents: 6500,
    paymentStatus: "unpaid",
    familyUserId: uFamily.id,
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
  });
  findOrCreateOrder(elderZhang.id, svcRehab.id, "completed", {
    amountCents: 8000,
    paymentStatus: "paid",
    familyUserId: uFamily.id,
    studentUserId: uStudent.id,
    scheduledAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  });
  findOrCreateOrder(elderLi.id, svcLife.id, "completed", {
    amountCents: 7000,
    paymentStatus: "paid",
    familyUserId: uFamily.id,
    studentUserId: uStudent.id,
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
  });

  return e.json(200, {
    ok: true,
    message: "演示账号已写入（可重复执行）",
    stats: stats,
    accounts: {
      student: [
        "student1@test.nuanban.dev",
        "student2@test.nuanban.dev",
        "student3@test.nuanban.dev",
      ],
      family: ["family1@test.nuanban.dev"],
      elder: ["elder1@test.nuanban.dev"],
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

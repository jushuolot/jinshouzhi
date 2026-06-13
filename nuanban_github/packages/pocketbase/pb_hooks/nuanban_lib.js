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

function findOrCreateOrgByName(name, lat, lng) {
  var trimmed = String(name || "").trim().slice(0, 128);
  if (!trimmed) throw new Error("机构名称不能为空");
  var rows = $app.findRecordsByFilter(
    "organizations",
    "name = {:n}",
    "",
    1,
    0,
    { n: trimmed }
  );
  if (rows.length > 0) {
    var org = rows[0];
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      org.set("latitude", lat);
      org.set("longitude", lng);
      $app.save(org);
    }
    return org;
  }
  var col = $app.findCollectionByNameOrId("organizations");
  var rec = new Record(col);
  rec.set("name", trimmed);
  rec.set("enabled", true);
  rec.set("latitude", lat != null && !isNaN(lat) ? lat : 31.2304);
  rec.set("longitude", lng != null && !isNaN(lng) ? lng : 121.4737);
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

function serviceCategoryDto(rec) {
  return {
    id: rec.id,
    name: safeRecordString(rec, "name", ""),
    sortOrder: safeRecordInt(rec, "sort_order", 0),
  };
}

function serviceItemDto(rec) {
  var catId = safeRecordString(rec, "category", "");
  var catName = "";
  if (catId) {
    try {
      var c = $app.findRecordById("service_categories", catId);
      catName = safeRecordString(c, "name", "");
    } catch (_) {}
  }
  var priceCents = safeRecordInt(rec, "price_cents", 0);
  return {
    id: rec.id,
    name: safeRecordString(rec, "name", ""),
    categoryId: catId,
    categoryName: catName,
    priceCents: priceCents,
    priceYuan: (priceCents / 100).toFixed(2),
    durationMinutes: safeRecordInt(rec, "duration_minutes", 60),
    requiresOutdoorApproval: safeRecordBool(rec, "requires_outdoor_approval", false),
    enabled: safeRecordBool(rec, "enabled", false),
  };
}

function listServiceCatalog() {
  var cats = $app.findRecordsByFilter("service_categories", 'name != ""', "sort_order", 200, 0);
  var items = $app.findRecordsByFilter("service_items", 'name != ""', "name", 500, 0);
  var catDtos = [];
  var catMap = {};
  for (var i = 0; i < cats.length; i++) {
    var dto = serviceCategoryDto(cats[i]);
    dto.items = [];
    catDtos.push(dto);
    catMap[dto.id] = dto;
  }
  var uncategorized = [];
  var enabledCount = 0;
  for (var k = 0; k < items.length; k++) {
    var itemDto = serviceItemDto(items[k]);
    if (itemDto.enabled) enabledCount += 1;
    var cid = itemDto.categoryId;
    if (cid && catMap[cid]) catMap[cid].items.push(itemDto);
    else uncategorized.push(itemDto);
  }
  return {
    categories: catDtos,
    uncategorized: uncategorized,
    totalItems: items.length,
    enabledCount: enabledCount,
  };
}

function createServiceCategory(body) {
  var name = String(body.name || "").trim();
  if (!name) throw new Error("请输入类目名称");
  var existing = $app.findRecordsByFilter(
    "service_categories",
    "name = {:n}",
    "",
    1,
    0,
    { n: name }
  );
  if (existing.length > 0) return serviceCategoryDto(existing[0]);
  var col = $app.findCollectionByNameOrId("service_categories");
  var rec = new Record(col);
  rec.set("name", name);
  var sortOrder = parseInt(body.sortOrder, 10);
  rec.set("sort_order", isNaN(sortOrder) ? 1 : sortOrder);
  $app.save(rec);
  return serviceCategoryDto(rec);
}

function upsertServiceItem(body, id) {
  var categoryId = String(body.categoryId || "").trim();
  var name = String(body.name || "").trim();
  var priceCents = parseInt(body.priceCents, 10);
  if (!categoryId) throw new Error("请选择服务类目");
  if (!name) throw new Error("请输入服务名称");
  if (isNaN(priceCents) || priceCents < 0) throw new Error("请填写有效价格");
  try {
    $app.findRecordById("service_categories", categoryId);
  } catch (_) {
    throw new Error("服务类目不存在");
  }
  var rec;
  if (id) {
    rec = $app.findRecordById("service_items", id);
  } else {
    var col = $app.findCollectionByNameOrId("service_items");
    rec = new Record(col);
  }
  rec.set("category", categoryId);
  rec.set("name", name);
  rec.set("price_cents", priceCents);
  var duration = parseInt(body.durationMinutes, 10);
  rec.set("duration_minutes", isNaN(duration) || duration <= 0 ? 60 : duration);
  if (body.requiresOutdoorApproval != null) {
    rec.set("requires_outdoor_approval", !!body.requiresOutdoorApproval);
  } else if (!id) {
    rec.set("requires_outdoor_approval", false);
  }
  if (body.enabled != null) rec.set("enabled", !!body.enabled);
  else if (!id) rec.set("enabled", true);
  $app.save(rec);
  return serviceItemDto(rec);
}

var ORDER_TIMELINE_MEM = {};
var ORDER_MESSAGES_MEM = {};
var ORDER_CALLS_MEM = {};
var ORDER_CALL_SIGNAL_MEM = {};

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
    order.set("status_timeline", JSON.stringify(list || []));
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

function serviceLogSummaryFromOrder(order) {
  var timeline = readOrderTimeline(order);
  for (var i = timeline.length - 1; i >= 0; i--) {
    var ev = timeline[i];
    if (ev && ev.detail) {
      var d = String(ev.detail).trim();
      if (d) return d;
    }
  }
  var svc = serviceInfoById(safeRecordString(order, "service_item", ""));
  return svc.name ? "已完成「" + svc.name + "」" : "服务已完成";
}

function serviceLogDtoFromOrder(order) {
  var elderId = safeRecordString(order, "elder", "");
  var svc = serviceInfoById(safeRecordString(order, "service_item", ""));
  var createdAt = safeRecordString(order, "scheduled_at", "");
  if (!createdAt) createdAt = safeRecordString(order, "updated", "");
  return {
    id: "log-" + order.id,
    orderId: order.id,
    elderId: elderId,
    elderName: elderNameById(elderId),
    serviceName: svc.name,
    summary: serviceLogSummaryFromOrder(order),
    createdAt: createdAt,
  };
}

function platformActivityKindFromKey(key) {
  var k = String(key || "");
  if (k === "completed" || k === "pending_confirm") return "order_confirmed";
  if (k === "pending_accept" || k === "pending_service" || k === "in_service") return "order_accepted";
  if (k === "pending_payment" || k === "paid") return "order_paid";
  if (k.indexOf("outdoor") >= 0) return "outdoor_approved";
  return "order_updated";
}

function platformActivityFromOrders(limit) {
  limit = limit || 20;
  var records = [];
  try {
    records = $app.findRecordsByFilter("orders", 'status != ""', "-updated", 80, 0);
  } catch (_) {}
  var list = [];
  for (var i = 0; i < records.length; i++) {
    var order = records[i];
    var timeline = readOrderTimeline(order);
    if (!timeline.length) continue;
    var ev = timeline[timeline.length - 1];
    var elderName = elderNameById(safeRecordString(order, "elder", ""));
    var svc = serviceInfoById(safeRecordString(order, "service_item", ""));
    var detail = ev.detail ? String(ev.detail) : svc.name;
    if (elderName && detail.indexOf(elderName) < 0) detail = elderName + " · " + detail;
    list.push({
      id: "act-" + order.id + "-" + timeline.length,
      kind: platformActivityKindFromKey(ev.key),
      title: detail,
      detail: svc.name || detail,
      createdAt: ev.at || safeRecordString(order, "updated", ""),
    });
    if (list.length >= limit) break;
  }
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
    callOpen: orderCallThreadOpen(safeRecordString(o, "status", "")),
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

function studentCanServeCaregiver(roleRec) {
  if (safeRecordString(roleRec, "role", "") !== "student") return false;
  if (safeRecordString(roleRec, "status", "") !== "active") return false;
  return !!safeRecordString(roleRec, "display_name", "").trim();
}

function caregiverDistanceLabel(km) {
  if (km == null || isNaN(km) || km < 0) return "—";
  if (km < 1) return String(Math.round(km * 1000)) + "m";
  return (Math.round(km * 10) / 10).toFixed(1) + "km";
}

function caregiverServiceTags(roleRec) {
  var areas = readServiceAreaGeo(roleRec);
  var tags = [];
  var polys = areas.polygons || [];
  for (var i = 0; i < polys.length; i++) {
    var lbl = polys[i] && polys[i].label ? String(polys[i].label).trim() : "";
    if (lbl) tags.push(lbl);
  }
  return tags;
}

function maskContactPhone(phone) {
  var p = String(phone || "").replace(/\D/g, "");
  if (p.length !== 11) return p || "未填写";
  return p.slice(0, 3) + "****" + p.slice(7);
}

function serviceAreaLabels(roleRec) {
  var areas = readServiceAreaGeo(roleRec);
  var labels = [];
  var polys = areas.polygons || [];
  for (var i = 0; i < polys.length; i++) {
    var lbl = polys[i] && polys[i].label ? String(polys[i].label).trim() : "";
    if (lbl) labels.push(lbl);
  }
  return labels;
}

function countStudentCompletedOrders(userId) {
  if (!userId) return 0;
  try {
    var orders = $app.findRecordsByFilter(
      "orders",
      'student = {:uid} && status = "completed"',
      "",
      500,
      0,
      { uid: userId }
    );
    return orders.length;
  } catch (_) {}
  return 0;
}

function caregiverDetailFromRole(roleRec, elderLat, elderLng) {
  var uid = roleRec.getString("user");
  var auth = null;
  try {
    auth = $app.findRecordById("users", uid);
  } catch (_) {}
  var listItem = caregiverListItemFromRole(roleRec, elderLat, elderLng);
  var major = safeRecordString(roleRec, "major", "");
  var grade = safeRecordString(roleRec, "grade", "");
  var bio = safeRecordString(roleRec, "bio", "");
  var hours = readJsonStringArray(roleRec, "available_hours");
  var areas = serviceAreaLabels(roleRec);
  var contact = studentContactPhone(roleRec, auth);
  var orderCount = countStudentCompletedOrders(uid);
  return {
    id: roleRec.id,
    userId: uid,
    name: listItem.name,
    school: listItem.school,
    distanceKm: listItem.distanceKm,
    distance: listItem.distance,
    rating: orderCount > 0 ? 4.8 : 0,
    orderCount: orderCount,
    intro: listItem.intro,
    tags: listItem.tags,
    gender: listItem.gender,
    major: major || "未填",
    grade: grade || "未填",
    age: 0,
    phone: maskContactPhone(contact),
    bio: bio,
    serviceAreas: areas,
    availableHours: hours,
    certifications: [],
    languages: [],
    personalityTags: [],
    serviceTypes: [],
    completedOrderThemes: [],
    reviewSummary: "",
  };
}

function caregiverListItemFromRole(roleRec, elderLat, elderLng) {
  var schoolId = roleRec.getString("school");
  var schoolName = "";
  if (schoolId) {
    try {
      var s = $app.findRecordById("school_dict", schoolId);
      schoolName = safeRecordString(s, "name", "");
    } catch (_) {}
  }
  var slat = roleRec.getFloat("latitude");
  var slng = roleRec.getFloat("longitude");
  var distanceKm = null;
  if (elderLat && elderLng && slat && slng) {
    distanceKm = haversineM(elderLat, elderLng, slat, slng) / 1000;
    distanceKm = Math.round(distanceKm * 10) / 10;
  }
  var name = safeRecordString(roleRec, "display_name", "同学");
  return {
    id: roleRec.id,
    userId: roleRec.getString("user"),
    name: name,
    school: schoolName || "高校志愿者",
    gender: safeRecordString(roleRec, "gender", "未填"),
    distanceKm: distanceKm,
    distance: caregiverDistanceLabel(distanceKm),
    tags: caregiverServiceTags(roleRec),
    rating: 4.8,
    orderCount: 0,
    intro: name + "——暖伴勤工志愿者",
    canServe: true,
  };
}

function caregiverMatchesFilters(item, opts) {
  var radiusKm = opts.radiusKm;
  if (radiusKm != null && !isNaN(radiusKm) && radiusKm > 0) {
    if (item.distanceKm == null || item.distanceKm > radiusKm) return false;
  }
  var gender = opts.gender ? String(opts.gender).trim() : "";
  if (gender && gender !== "全部" && item.gender !== gender) return false;
  var school = opts.school ? String(opts.school).trim().toLowerCase() : "";
  if (school && String(item.school || "").toLowerCase().indexOf(school) < 0) return false;
  var q = opts.q ? String(opts.q).trim().toLowerCase() : "";
  if (q) {
    var hay = [item.name, item.school, item.gender, item.distance, (item.tags || []).join(" ")]
      .join(" ")
      .toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
}

function listCaregiversForElder(opts) {
  opts = opts || {};
  var elderLat = parseFloat(opts.lat || "0");
  var elderLng = parseFloat(opts.lng || "0");
  var radiusRaw = opts.radiusKm;
  var radiusKm = radiusRaw != null && radiusRaw !== "" ? parseFloat(radiusRaw) : null;

  var students = $app.findRecordsByFilter(
    "user_roles",
    'role = "student" && status = "active"',
    "",
    200,
    0
  );

  var all = [];
  for (var i = 0; i < students.length; i++) {
    var r = students[i];
    if (!studentCanServeCaregiver(r)) continue;
    all.push(caregiverListItemFromRole(r, elderLat, elderLng));
  }

  all.sort(function (a, b) {
    var ad = a.distanceKm;
    var bd = b.distanceKm;
    if (ad == null && bd == null) return String(a.name).localeCompare(String(b.name), "zh");
    if (ad == null) return 1;
    if (bd == null) return -1;
    if (ad !== bd) return ad - bd;
    return String(a.name).localeCompare(String(b.name), "zh");
  });

  var filtered = [];
  for (var j = 0; j < all.length; j++) {
    if (caregiverMatchesFilters(all[j], {
      radiusKm: radiusKm,
      gender: opts.gender,
      school: opts.school,
      q: opts.q,
    })) {
      filtered.push(all[j]);
    }
  }

  return { list: filtered, total: all.length, filtered: filtered.length };
}

function countActiveCaregivers() {
  var students = $app.findRecordsByFilter(
    "user_roles",
    'role = "student" && status = "active"',
    "",
    200,
    0
  );
  var n = 0;
  for (var i = 0; i < students.length; i++) {
    if (studentCanServeCaregiver(students[i])) n += 1;
  }
  return n;
}

/** studentId 可能是 users.id 或 user_roles.id，统一解析为 users.id */
function resolveStudentUserId(idOrRoleId) {
  var raw = String(idOrRoleId || "").trim();
  if (!raw) return "";
  try {
    $app.findRecordById("users", raw);
    return raw;
  } catch (_) {}
  try {
    var role = $app.findRecordById("user_roles", raw);
    if (safeRecordString(role, "role", "") !== "student") return "";
    var uid = safeRecordString(role, "user", "");
    if (!uid) return "";
    $app.findRecordById("users", uid);
    return uid;
  } catch (_) {}
  return "";
}

function primaryFamilyUserForElder(elderId) {
  try {
    var rows = $app.findRecordsByFilter(
      "family_elder_bindings",
      "elder = {:eid}",
      "-created",
      5,
      0,
      { eid: elderId }
    );
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getBool("is_primary_payer")) {
        return safeRecordString(rows[i], "family_user", "");
      }
    }
    if (rows.length) return safeRecordString(rows[0], "family_user", "");
  } catch (_) {}
  return "";
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
    callOpen: orderCallThreadOpen(order.getString("status")),
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
    callOpen: orderCallThreadOpen(order.getString("status")),
  };
}

function orderCallThreadOpen(status) {
  return status === "pending_service" || status === "in_service";
}

function orderCallMaskedNumber(orderId) {
  var h = 0;
  for (var i = 0; i < orderId.length; i++) {
    h = ((h << 5) - h + orderId.charCodeAt(i)) | 0;
  }
  h = Math.abs(h);
  var ext = String(h % 10000000);
  while (ext.length < 7) ext = "0" + ext;
  return "400" + ext;
}

function orderCallMaskedNumberDisplay(num) {
  var s = String(num || "");
  if (s.length < 10) return s;
  return s.slice(0, 3) + "-" + s.slice(3, 6) + "-" + s.slice(6);
}

function orderCallPeerAlias(order, callerRole) {
  if (callerRole === "student") {
    try {
      if (order.getString("family_user")) return "家属·联系人";
    } catch (_) {}
    return "老人·本人";
  }
  try {
    var su = order.getString("student_user");
    if (su) return orderChatAlias(su, "student");
  } catch (_) {}
  return "陪护同学";
}

function orderCallLog(orderId, callerUser, callerRole) {
  if (!ORDER_CALLS_MEM[orderId]) ORDER_CALLS_MEM[orderId] = [];
  var entry = {
    id: "call_" + orderId + "_" + (ORDER_CALLS_MEM[orderId].length + 1),
    callerUser: callerUser,
    callerRole: callerRole,
    maskedNumber: orderCallMaskedNumber(orderId),
    at: new Date().toISOString(),
  };
  ORDER_CALLS_MEM[orderId].push(entry);
  return entry;
}

function orderCallRoomId(orderId) {
  return "room_order_" + orderId;
}

function orderCallIceServers() {
  var stunRaw = $os.getenv("NUANBAN_STUN_URLS") || "stun:stun.l.google.com:19302";
  var servers = [];
  var parts = String(stunRaw).split(",");
  for (var i = 0; i < parts.length; i++) {
    var u = parts[i].trim();
    if (u) servers.push({ urls: u });
  }
  var turnUrl = $os.getenv("NUANBAN_TURN_URL") || "";
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: $os.getenv("NUANBAN_TURN_USER") || "",
      credential: $os.getenv("NUANBAN_TURN_PASS") || "",
    });
  }
  return servers;
}

function orderCallClientId(userId, orderId) {
  var h = 0;
  var seed = String(userId) + ":" + String(orderId);
  for (var i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return "cid_" + Math.abs(h).toString(36);
}

function orderCallSignalSession(orderId) {
  if (!ORDER_CALL_SIGNAL_MEM[orderId]) {
    ORDER_CALL_SIGNAL_MEM[orderId] = {
      roomId: orderCallRoomId(orderId),
      status: "waiting",
      signals: [],
      nextSeq: 1,
      participants: {},
    };
  }
  return ORDER_CALL_SIGNAL_MEM[orderId];
}

function orderCallSignalPush(orderId, fromUser, clientId, type, payload) {
  var sess = orderCallSignalSession(orderId);
  var seq = sess.nextSeq++;
  var sig = {
    seq: seq,
    fromUser: fromUser,
    clientId: clientId,
    type: type,
    at: new Date().toISOString(),
  };
  if (payload && payload.sdp) sig.sdp = payload.sdp;
  if (payload && payload.candidate) sig.candidate = payload.candidate;
  sess.signals.push(sig);
  if (type === "hangup") sess.status = "ended";
  else if (type === "join" && sess.status === "waiting") sess.status = "active";
  return sig;
}

function orderCallSignalJoin(orderId, userId, clientId) {
  var sess = orderCallSignalSession(orderId);
  sess.participants[userId] = { clientId: clientId, joinedAt: new Date().toISOString() };
  return orderCallSignalPush(orderId, userId, clientId, "join", null);
}

function orderCallSignalPost(orderId, userId, clientId, body) {
  var type = String(body.type || "").trim();
  var allowed = { offer: 1, answer: 1, ice: 1, hangup: 1, join: 1 };
  if (!allowed[type]) throw new Error("无效信令类型");
  if (type === "join") return orderCallSignalJoin(orderId, userId, clientId);
  var payload = {};
  if (body.sdp) payload.sdp = body.sdp;
  if (body.candidate) payload.candidate = body.candidate;
  return orderCallSignalPush(orderId, userId, clientId, type, payload);
}

function orderCallSignalPoll(orderId, userId, clientId, since) {
  var sess = orderCallSignalSession(orderId);
  var sinceSeq = parseInt(String(since || "0"), 10);
  if (isNaN(sinceSeq) || sinceSeq < 0) sinceSeq = 0;
  var out = [];
  for (var i = 0; i < sess.signals.length; i++) {
    var s = sess.signals[i];
    if (s.seq <= sinceSeq) continue;
    if (s.fromUser === userId && s.clientId === clientId) continue;
    out.push(s);
  }
  var maxSeq = sinceSeq;
  for (var j = 0; j < sess.signals.length; j++) {
    if (sess.signals[j].seq > maxSeq) maxSeq = sess.signals[j].seq;
  }
  return { signals: out, since: maxSeq, roomId: sess.roomId, status: sess.status };
}

function orderCallSignalLeave(orderId, userId, clientId) {
  return orderCallSignalPush(orderId, userId, clientId, "hangup", null);
}

function orderCallInfoDto(order, callerRole) {
  var status = order.getString("status");
  var open = orderCallThreadOpen(status);
  var masked = orderCallMaskedNumber(order.id);
  return {
    callOpen: open,
    mode: "webrtc",
    roomId: orderCallRoomId(order.id),
    iceServers: orderCallIceServers(),
    maskedNumber: masked,
    maskedNumberDisplay: orderCallMaskedNumberDisplay(masked),
    peerAlias: open ? orderCallPeerAlias(order, callerRole) : "",
    hint: open
      ? "H5 实时语音通话，双方通过 WebRTC 直连。演示环境为模拟隐私号兜底。"
      : "待服务或服务进行中可语音通话",
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

function roleStatusForClient(roleRec) {
  var status = safeRecordString(roleRec, "status", "");
  if (status) return status;
  var role = safeRecordString(roleRec, "role", "student");
  return role === "student" ? "pending" : "active";
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

var PRESET_DEMO_STUDENT_EMAILS = {};

function isPresetDemoStudentEmail(email) {
  return false;
}

function demoStudentSettlements() {
  return [];
}

function studentSettlementsForUser(userId) {
  return [];
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

function familyRoleRecord(uid) {
  var roles = $app.findRecordsByFilter(
    "user_roles",
    'user = {:uid} && role = "family"',
    "",
    1,
    0,
    { uid: uid }
  );
  return roles.length > 0 ? roles[0] : null;
}

function readFamilyProfileMeta(roleRec) {
  var raw = safeRecordString(roleRec, "bio", "");
  if (!raw || raw.charAt(0) !== "{") {
    return { district: "", address: "", relationToElder: "" };
  }
  try {
    var o = JSON.parse(raw);
    return {
      district: String(o.district || ""),
      address: String(o.address || ""),
      relationToElder: String(o.relationToElder || ""),
    };
  } catch (_) {
    return { district: "", address: "", relationToElder: "" };
  }
}

function writeFamilyProfileMeta(roleRec, meta) {
  roleRec.set(
    "bio",
    JSON.stringify({
      district: String(meta.district || "").trim(),
      address: String(meta.address || "").trim(),
      relationToElder: String(meta.relationToElder || "家属").trim(),
    })
  );
}

function familyProfileDtoFromRole(roleRec, auth, e) {
  var meta = readFamilyProfileMeta(roleRec);
  var av = userAvatarFields(auth, e);
  var nickname = safeRecordString(auth, "name", "") || safeRecordString(roleRec, "display_name", "家属");
  var contactPhone = studentContactPhone(roleRec, auth);
  var bindings = $app.findRecordsByFilter(
    "family_elder_bindings",
    "family_user = {:uid}",
    "",
    1,
    0,
    { uid: auth.id }
  );
  var elderName = "";
  var elderId = "";
  var relation = meta.relationToElder || "家属";
  if (bindings.length > 0) {
    var b = bindings[0];
    if (!meta.relationToElder) relation = safeRecordString(b, "relation_label", relation);
    elderId = safeRecordString(b, "elder", "");
    if (elderId) {
      try {
        var elder = $app.findRecordById("elders", elderId);
        elderName = safeRecordString(elder, "name", "");
      } catch (_) {}
    }
  }
  return {
    nickname: nickname,
    email: safeRecordString(auth, "email", ""),
    avatarUrl: av.avatarUrl,
    profileComplete: !!(nickname && contactPhone && meta.district),
    relationToElder: relation,
    linkedElderName: elderName,
    linkedElderId: elderId,
    contactPhone: contactPhone,
    district: meta.district,
    address: meta.address,
    notificationPrefs: ["订单状态变更", "外出审批提醒", "SOS 紧急通知", "支付成功通知"],
  };
}

function studentWithdrawalOverview(uid) {
  var store = studentWithdrawalsMap();
  var settlements = studentSettlementsForUser(uid);
  if (!store[uid]) store[uid] = [];
  var withdrawals = store[uid];
  var bal = studentWithdrawalBalances(settlements, withdrawals);
  return {
    availableCents: bal.availableCents,
    availableYuan: (bal.availableCents / 100).toFixed(2),
    frozenCents: bal.frozenCents,
    frozenYuan: (bal.frozenCents / 100).toFixed(2),
    boundWechat: "",
    boundBank: "",
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

/** 正式鉴权：禁用演示万能码、禁止 dev 登录、不向客户端泄露 devCode */
function isFormalAuthMode() {
  try {
    var v = $os.getenv("NUANBAN_FORMAL_AUTH");
    return v === "true" || v === "1";
  } catch (_) {}
  return false;
}

function phoneLoginEmail(phone) {
  var digits = String(phone || "").replace(/\D/g, "");
  return "m" + digits + "@test.nuanban.dev";
}

function opsPhoneFromEmail(email) {
  var m = String(email || "").match(/^m(\d{11})@/);
  return m ? m[1] : "";
}

function opsStudentRowFromRole(r, e) {
  var uid = r.getString("user");
  var user = null;
  try {
    user = $app.findRecordById("users", uid);
  } catch (_) {}
  var schoolName = "";
  var schoolId = safeRecordString(r, "school", "");
  if (schoolId) {
    try {
      var s = $app.findRecordById("school_dict", schoolId);
      schoolName = safeRecordString(s, "name", "");
    } catch (_) {}
  }
  var displayName = safeRecordString(r, "display_name", "");
  var email = user ? user.getString("email") : "";
  return {
    userId: uid,
    displayName: displayName || (user ? user.getString("name") : "学生"),
    nickname: user ? user.getString("name") : displayName,
    email: email,
    schoolName: schoolName,
    status: safeRecordString(r, "status", "active"),
    cartoonAvatarId: safeRecordString(r, "cartoon_avatar_id", ""),
    avatarUrl: user ? userAvatarUrlForClient(user, e) : "",
    verificationPhotoUrl: roleFileUrlForClient(r, "verification_photo", e),
    gender: safeRecordString(r, "gender", "") || "未填",
    major: safeRecordString(r, "major", ""),
    grade: safeRecordString(r, "grade", ""),
    contactPhone: studentContactPhone(r, user),
    studentId: safeRecordString(r, "student_id", ""),
    customCartoonAvatarUrl: roleFileUrlForClient(r, "custom_cartoon_avatar", e),
    serviceAreaPolygons: readServiceAreaGeo(r).polygons || [],
    serviceHours: readJsonStringArray(r, "available_hours"),
    phone: opsPhoneFromEmail(email),
  };
}

function readJsonStringArray(rec, field) {
  var raw = safeRecordString(rec, field, "");
  if (!raw) return [];
  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeJsonStringArray(rec, field, arr) {
  try {
    rec.set(field, JSON.stringify(arr || []));
  } catch (_) {}
}

function readServiceAreaGeo(rec) {
  var raw = safeRecordString(rec, "service_areas", "");
  if (!raw) return { polygons: [] };
  try {
    var parsed = JSON.parse(raw);
    if (parsed && parsed.polygons && Array.isArray(parsed.polygons)) {
      return parsed;
    }
    return { polygons: [] };
  } catch (_) {
    return { polygons: [] };
  }
}

function writeServiceAreaGeo(rec, geo) {
  try {
    var payload = geo && geo.polygons ? geo : { polygons: [] };
    rec.set("service_areas", JSON.stringify(payload));
  } catch (_) {}
}

function studentContactPhone(roleRec, auth) {
  var cp = safeRecordString(roleRec, "contact_phone", "");
  if (cp) return cp;
  if (auth) {
    var fromEmail = opsPhoneFromEmail(safeRecordString(auth, "email", ""));
    if (fromEmail) return fromEmail;
  }
  return "";
}

function studentProfileDtoFromRole(roleRec, auth, e) {
  var schoolName = "";
  var schoolId = safeRecordString(roleRec, "school", "");
  if (schoolId) {
    try {
      var s = $app.findRecordById("school_dict", schoolId);
      schoolName = safeRecordString(s, "name", "");
    } catch (_) {}
  }
  var displayName = safeRecordString(roleRec, "display_name", "");
  var av = userAvatarFields(auth, e);
  var auditStatus = safeRecordString(roleRec, "status", "");
  return {
    nickname: safeRecordString(auth, "name", displayName || "学生"),
    email: safeRecordString(auth, "email", ""),
    schoolName: schoolName,
    displayName: displayName,
    profileComplete: !!(function () {
      var cp = studentContactPhone(roleRec, auth);
      var areas = readServiceAreaGeo(roleRec).polygons || [];
      var hours = readJsonStringArray(roleRec, "available_hours");
      var hasAvatar = !!(safeRecordString(roleRec, "cartoon_avatar_id", "") || roleFileUrlForClient(roleRec, "custom_cartoon_avatar", e));
      var hasAreas = false;
      for (var ai = 0; ai < areas.length; ai++) {
        if (areas[ai].ring && areas[ai].ring.length >= 3) { hasAreas = true; break; }
      }
      return !!(
        displayName
        && schoolName
        && cp
        && roleFileUrlForClient(roleRec, "verification_photo", e)
        && hasAvatar
        && hasAreas
        && hours.length > 0
      );
    })(),
    cartoonAvatarId: safeRecordString(roleRec, "cartoon_avatar_id", ""),
    avatarUrl: av.avatarUrl,
    verificationPhotoUrl: roleFileUrlForClient(roleRec, "verification_photo", e),
    gender: safeRecordString(roleRec, "gender", "未填") || "未填",
    major: safeRecordString(roleRec, "major", ""),
    grade: safeRecordString(roleRec, "grade", ""),
    contactPhone: studentContactPhone(roleRec, auth),
    studentId: safeRecordString(roleRec, "student_id", ""),
    customCartoonAvatarUrl: roleFileUrlForClient(roleRec, "custom_cartoon_avatar", e),
    serviceAreaPolygons: readServiceAreaGeo(roleRec).polygons || [],
    serviceHours: readJsonStringArray(roleRec, "available_hours"),
    auditStatus: auditStatus,
    auditLocked: auditStatus === "active",
  };
}

function elderOrgProfileComplete(elder) {
  if (!elder) return false;
  var orgId = safeRecordString(elder, "org", "");
  var district = safeRecordString(elder, "district", "").trim();
  var health = safeRecordString(elder, "health_status", "").trim();
  var mobility = safeRecordString(elder, "mobility", "").trim();
  var living = safeRecordString(elder, "living_situation", "").trim();
  return !!(orgId && district && health && mobility && living);
}

function elderOrgProfileHint(complete) {
  if (complete) return "";
  return "机构档案待补充，家属可联系养老院；运营请在「运营台 → 机构 → 老人机构档案」填写。";
}

function ensureElderProfileLinked(roleRec, auth, opts) {
  opts = opts || {};
  var elderId = "";
  try {
    elderId = roleRec.getString("elder_profile") || "";
  } catch (_) {}
  var elder = null;
  if (elderId) {
    try {
      elder = $app.findRecordById("elders", elderId);
    } catch (_) {}
  }
  if (!elder) {
    var col = $app.findCollectionByNameOrId("elders");
    elder = new Record(col);
    var name = opts.displayName || safeRecordString(auth, "name", "") || "老人用户";
    elder.set("name", String(name).trim().slice(0, 64) || "老人用户");
    if (opts.gender) elder.set("gender", String(opts.gender));
    elder.set("enabled", true);
    elder.set("latitude", 31.2304);
    elder.set("longitude", 121.4737);
    try {
      var orgRows = $app.findRecordsByFilter("organizations", "enabled = true", "", 1, 0);
      if (orgRows.length > 0) {
        elder.set("org", orgRows[0].id);
      } else {
        var orgCol = $app.findCollectionByNameOrId("organizations");
        var orgRec = new Record(orgCol);
        orgRec.set("name", "待指定机构");
        orgRec.set("enabled", true);
        orgRec.set("latitude", 31.2304);
        orgRec.set("longitude", 121.4737);
        $app.save(orgRec);
        elder.set("org", orgRec.id);
      }
    } catch (_) {}
    var loginPhone = opsPhoneFromEmail(safeRecordString(auth, "email", ""));
    if (loginPhone) elder.set("phone", loginPhone);
    $app.save(elder);
    roleRec.set("elder_profile", elder.id);
    $app.save(roleRec);
  } else {
    var syncPhone = opsPhoneFromEmail(safeRecordString(auth, "email", ""));
    if (syncPhone && !safeRecordString(elder, "phone", "")) {
      elder.set("phone", syncPhone);
      $app.save(elder);
    }
  }
  return elder;
}

function opsElderLinkedAuth(elderId) {
  var out = { user: null, role: null };
  if (!elderId) return out;
  try {
    var roles = $app.findRecordsByFilter(
      "user_roles",
      'elder_profile = {:eid} && role = "elder"',
      "",
      1,
      0,
      { eid: elderId }
    );
    if (!roles.length) return out;
    out.role = roles[0];
    out.user = $app.findRecordById("users", roles[0].getString("user"));
  } catch (_) {}
  return out;
}

function opsElderRowFromRecord(elder, e) {
  var orgName = "";
  var orgId = safeRecordString(elder, "org", "");
  if (orgId) {
    try {
      var o = $app.findRecordById("organizations", orgId);
      orgName = safeRecordString(o, "name", "");
    } catch (_) {}
  }
  var linked = opsElderLinkedAuth(elder.id);
  var loginPhone = "";
  var avatarUrl = "";
  var userId = "";
  if (linked.user) {
    userId = linked.user.id;
    loginPhone = opsPhoneFromEmail(safeRecordString(linked.user, "email", ""));
    if (e) avatarUrl = userAvatarUrlForClient(linked.user, e);
  }
  var phone = safeRecordString(elder, "phone", "") || loginPhone;
  return {
    id: elder.id,
    userId: userId,
    name: safeRecordString(elder, "name", ""),
    phone: phone,
    loginPhone: loginPhone,
    avatarUrl: avatarUrl,
    age: elder.getInt("age") || 0,
    gender: safeRecordString(elder, "gender", ""),
    address: safeRecordString(elder, "address", ""),
    orgId: orgId,
    orgName: orgName,
    district: safeRecordString(elder, "district", ""),
    livingSituation: safeRecordString(elder, "living_situation", ""),
    healthStatus: safeRecordString(elder, "health_status", ""),
    mobility: safeRecordString(elder, "mobility", ""),
    emergencyContactName: safeRecordString(elder, "emergency_contact_name", ""),
    emergencyContactRelation: safeRecordString(elder, "emergency_contact_relation", ""),
    emergencyContactPhone: safeRecordString(elder, "emergency_contact_phone", ""),
    notes: safeRecordString(elder, "notes", ""),
    latitude: elder.getFloat("latitude") || 0,
    longitude: elder.getFloat("longitude") || 0,
    enabled: safeRecordBool(elder, "enabled", true),
    orgProfileComplete: elderOrgProfileComplete(elder),
  };
}

function opsElderApplyPatch(elder, body) {
  if (body.name != null) elder.set("name", String(body.name).trim().slice(0, 64));
  if (body.phone != null) elder.set("phone", String(body.phone).trim().slice(0, 20));
  if (body.age != null) elder.set("age", Number(body.age) || 0);
  if (body.gender != null) elder.set("gender", String(body.gender).trim().slice(0, 8));
  if (body.address != null) elder.set("address", String(body.address).trim().slice(0, 256));
  if (body.orgName != null) {
    var orgNameIn = String(body.orgName).trim();
    if (orgNameIn) {
      var oLat = body.latitude != null ? Number(body.latitude) : elder.getFloat("latitude");
      var oLng = body.longitude != null ? Number(body.longitude) : elder.getFloat("longitude");
      var orgRec = findOrCreateOrgByName(orgNameIn, oLat, oLng);
      elder.set("org", orgRec.id);
    }
  } else if (body.orgId) {
    try {
      $app.findRecordById("organizations", String(body.orgId));
      elder.set("org", String(body.orgId));
    } catch (_) {
      throw new Error("无效机构");
    }
  }
  if (body.latitude != null) elder.set("latitude", Number(body.latitude) || 0);
  if (body.longitude != null) elder.set("longitude", Number(body.longitude) || 0);
  if (body.district != null) elder.set("district", String(body.district).trim().slice(0, 64));
  if (body.livingSituation != null) {
    elder.set("living_situation", String(body.livingSituation).trim().slice(0, 128));
  }
  if (body.healthStatus != null) elder.set("health_status", String(body.healthStatus).trim().slice(0, 128));
  if (body.mobility != null) elder.set("mobility", String(body.mobility).trim().slice(0, 64));
  if (body.emergencyContactName != null) {
    elder.set("emergency_contact_name", String(body.emergencyContactName).trim().slice(0, 64));
  }
  if (body.emergencyContactRelation != null) {
    elder.set("emergency_contact_relation", String(body.emergencyContactRelation).trim().slice(0, 32));
  }
  if (body.emergencyContactPhone != null) {
    elder.set("emergency_contact_phone", String(body.emergencyContactPhone).trim().slice(0, 20));
  }
  if (body.notes != null) elder.set("notes", String(body.notes).trim().slice(0, 512));
  var linked = opsElderLinkedAuth(elder.id);
  if (body.name != null && linked.user) {
    linked.user.set("name", String(body.name).trim().slice(0, 64));
    $app.save(linked.user);
  }
  if (body.name != null && linked.role) {
    linked.role.set("display_name", String(body.name).trim().slice(0, 64));
    $app.save(linked.role);
  }
}

function opsElderMatchesKeyword(row, keyword) {
  var q = String(keyword || "").toLowerCase().trim();
  if (!q) return true;
  var digits = q.replace(/\D/g, "");
  if (digits.length >= 4) {
    var phones = [row.phone, row.loginPhone].join(" ").replace(/\D/g, " ");
    if (phones.indexOf(digits) >= 0) return true;
  }
  var hay = [
    row.name,
    row.orgName,
    row.district,
    row.id,
    row.phone,
    row.loginPhone,
    row.healthStatus,
    row.mobility,
    row.livingSituation,
    row.address,
  ]
    .join(" ")
    .toLowerCase();
  return hay.indexOf(q) >= 0;
}

function opsStudentMatchesKeyword(row, keyword) {
  var q = String(keyword || "").toLowerCase().trim();
  if (!q) return true;
  var hay = [
    row.displayName,
    row.nickname,
    row.email,
    row.schoolName,
    row.phone,
    row.contactPhone,
    row.studentId,
    row.userId,
    row.gender,
    row.major,
    row.grade,
    row.status,
  ]
    .join(" ")
    .toLowerCase();
  return hay.indexOf(q) >= 0;
}

function clearPlainObject(obj) {
  if (!obj) return;
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) delete obj[keys[i]];
}

function deleteAllInCollection(name) {
  var n = 0;
  try {
    $app.findCollectionByNameOrId(name);
  } catch (_) {
    return 0;
  }
  for (var round = 0; round < 500; round++) {
    var rows = $app.findRecordsByFilter(name, "id != ''", "", 100, 0, {});
    if (!rows || rows.length === 0) break;
    for (var i = 0; i < rows.length; i++) {
      try {
        $app.delete(rows[i]);
        n += 1;
      } catch (_) {}
    }
  }
  return n;
}

/** 清空全部业务数据（保留集合结构与超级管理员） */
function wipeAllCollections() {
  var stats = {};
  var collections = [
    "outdoor_approvals",
    "settlements",
    "schedules",
    "orders",
    "family_elder_bindings",
    "sos_alerts",
    "export_tasks",
    "school_designated_elder",
    "school_cooperation",
    "user_roles",
    "elders",
    "communities",
    "service_items",
    "service_categories",
    "organizations",
    "school_dict",
  ];
  for (var c = 0; c < collections.length; c++) {
    stats[collections[c]] = deleteAllInCollection(collections[c]);
  }
  return stats;
}

function deleteAllAuthUsers() {
  return deleteAllInCollection("users");
}

/** 清空进程内钱包、聊天、通话、提现等演示缓存 */
function wipeAllRuntimeState() {
  clearPlainObject(ORDER_TIMELINE_MEM);
  clearPlainObject(ORDER_MESSAGES_MEM);
  clearPlainObject(ORDER_CALLS_MEM);
  clearPlainObject(ORDER_CALL_SIGNAL_MEM);
  if (walletDemoStoreMap._data) clearPlainObject(walletDemoStoreMap._data);
  if (studentWithdrawalsMap._data) clearPlainObject(studentWithdrawalsMap._data);
  if (adminFundsReconcileMap._data) clearPlainObject(adminFundsReconcileMap._data);
}

function schoolCoopRow(rec) {
  var schoolId = safeRecordString(rec, "school", "");
  var orgId = safeRecordString(rec, "org", "");
  var schoolName = "";
  var orgName = "";
  if (schoolId) {
    try {
      var s = $app.findRecordById("school_dict", schoolId);
      schoolName = safeRecordString(s, "name", "");
    } catch (_) {}
  }
  if (orgId) {
    try {
      var o = $app.findRecordById("organizations", orgId);
      orgName = safeRecordString(o, "name", "");
    } catch (_) {}
  }
  return {
    id: rec.id,
    schoolId: schoolId,
    schoolName: schoolName,
    orgId: orgId,
    orgName: orgName,
    enabled: safeRecordBool(rec, "enabled", true),
  };
}

function listSchoolCooperationRows() {
  var recs = $app.findRecordsByFilter("school_cooperation", "", "id", 500, 0);
  var rows = [];
  for (var i = 0; i < recs.length; i++) rows.push(schoolCoopRow(recs[i]));
  return rows;
}

function schoolCoopGroupedByOrg() {
  var rows = listSchoolCooperationRows().filter(function (r) {
    return r.enabled;
  });
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r.orgId) continue;
    if (!map[r.orgId]) {
      map[r.orgId] = { orgId: r.orgId, orgName: r.orgName, schools: [], items: [] };
    }
    if (r.schoolName && map[r.orgId].schools.indexOf(r.schoolName) < 0) {
      map[r.orgId].schools.push(r.schoolName);
    }
    map[r.orgId].items.push(r);
  }
  var list = [];
  for (var k in map) {
    if (Object.prototype.hasOwnProperty.call(map, k)) list.push(map[k]);
  }
  list.sort(function (a, b) {
    return String(a.orgName).localeCompare(String(b.orgName), "zh");
  });
  return list;
}

function schoolCoopPartnerMap() {
  var rows = listSchoolCooperationRows().filter(function (r) {
    return r.enabled && r.orgId && r.schoolName;
  });
  var byOrg = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!byOrg[r.orgId]) byOrg[r.orgId] = [];
    if (byOrg[r.orgId].indexOf(r.schoolName) < 0) byOrg[r.orgId].push(r.schoolName);
  }
  return byOrg;
}

function orgPartnersSchoolInDb(orgId, schoolName) {
  if (!schoolName || !orgId) return true;
  var coopAll = $app.findRecordsByFilter(
    "school_cooperation",
    "org = {:oid}",
    "",
    200,
    0,
    { oid: orgId }
  );
  var hasEnabled = false;
  for (var i = 0; i < coopAll.length; i++) {
    if (safeRecordBool(coopAll[i], "enabled", false)) {
      hasEnabled = true;
      break;
    }
  }
  if (!hasEnabled) return true;
  var schools = $app.findRecordsByFilter(
    "school_dict",
    "name = {:n}",
    "",
    1,
    0,
    { n: schoolName }
  );
  if (schools.length === 0) return false;
  var matched = $app.findRecordsByFilter(
    "school_cooperation",
    "org = {:oid} && school = {:sid} && enabled = true",
    "",
    1,
    0,
    { oid: orgId, sid: schools[0].id }
  );
  return matched.length > 0;
}

function createSchoolCooperation(body) {
  var orgId = String(body.orgId || "").trim();
  var schoolName = String(body.schoolName || "").trim();
  if (!orgId) throw new Error("请选择机构");
  if (!schoolName) throw new Error("请选择学校");
  try {
    $app.findRecordById("organizations", orgId);
  } catch (_) {
    throw new Error("机构不存在");
  }
  var schoolRec = findOrCreateSchoolByName(schoolName);
  var existing = $app.findRecordsByFilter(
    "school_cooperation",
    "org = {:oid} && school = {:sid}",
    "",
    1,
    0,
    { oid: orgId, sid: schoolRec.id }
  );
  if (existing.length > 0) {
    existing[0].set("enabled", true);
    $app.save(existing[0]);
    return schoolCoopRow(existing[0]);
  }
  var col = $app.findCollectionByNameOrId("school_cooperation");
  var rec = new Record(col);
  rec.set("org", orgId);
  rec.set("school", schoolRec.id);
  rec.set("enabled", true);
  $app.save(rec);
  return schoolCoopRow(rec);
}

function disableSchoolCooperation(id) {
  var rec = $app.findRecordById("school_cooperation", id);
  rec.set("enabled", false);
  $app.save(rec);
  return schoolCoopRow(rec);
}

module.exports = {
  KNOWN_SCHOOLS, isKnownSchool, findOrCreateSchoolByName, findOrCreateOrgByName,
  elderNameById, safeRecordString, safeRecordInt, safeRecordBool, safeRecordFloat,
  serviceInfoById, orderToStudentDto, serviceLogSummaryFromOrder, serviceLogDtoFromOrder,
  platformActivityFromOrders, sosToDto, haversineM, orderToFamilyDto, orderToElderDto,
  elderProfileIdForUser, familyCanAccessOrder, completeOrderSchedule, finalizeOrderAfterConfirm,
  walletDemoStoreMap, walletEnsureUser, walletOverviewDto, walletTopup, walletPayLabel,
  walletDeductForOrder, walletPayOrderRecord, userHasRole, assertActiveRoleHeader,
  studentWithdrawalsMap, isPresetDemoStudentEmail, demoStudentSettlements, studentSettlementsForUser,
  studentWithdrawalBalances, studentWithdrawalOverview,
  adminFundsReconcileMap, adminFundOverview, adminFundCollectWallet, adminFundWithdrawalsList,
  adminApproveWithdrawal, adminRejectWithdrawal, adminMarkReconciled,
  requestBearerToken, requestOrigin, h5AppBaseUrl, userAvatarUrlForClient, userAvatarFields,
  roleFileUrlForClient, studentRoleRecord, familyRoleRecord,
  readFamilyProfileMeta, writeFamilyProfileMeta, familyProfileDtoFromRole,
  roleStatusForClient,
  readOrderTimeline, appendOrderTimeline, backfillOrderTimeline,
  orderChatThreadOpen, orderChatCanAccess, orderChatAlias,
  orderMessagesDto, orderMessageToDto, orderMessagePushText, orderMessagePushVoice,
  orderCallThreadOpen, orderCallPeerAlias, orderCallMaskedNumber, orderCallMaskedNumberDisplay,
  orderCallInfoDto, orderCallLog, orderCallRoomId, orderCallIceServers, orderCallClientId,
  orderCallSignalJoin, orderCallSignalPost, orderCallSignalPoll, orderCallSignalLeave,
  isFormalAuthMode, opsPhoneFromEmail, opsStudentRowFromRole, opsStudentMatchesKeyword,
  readJsonStringArray, writeJsonStringArray, readServiceAreaGeo, writeServiceAreaGeo,
  studentContactPhone, studentProfileDtoFromRole,
  elderOrgProfileComplete, elderOrgProfileHint, ensureElderProfileLinked,
  opsElderLinkedAuth, opsElderRowFromRecord, opsElderApplyPatch, opsElderMatchesKeyword,
  studentCanServeCaregiver, listCaregiversForElder, countActiveCaregivers, caregiverDetailFromRole,
  resolveStudentUserId, primaryFamilyUserForElder,
  phoneLoginEmail,
  listServiceCatalog, createServiceCategory, upsertServiceItem, serviceItemDto,
  schoolCoopRow, listSchoolCooperationRows, schoolCoopGroupedByOrg, schoolCoopPartnerMap,
  orgPartnersSchoolInDb, createSchoolCooperation, disableSchoolCooperation,
  wipeAllCollections, deleteAllAuthUsers, wipeAllRuntimeState,
};

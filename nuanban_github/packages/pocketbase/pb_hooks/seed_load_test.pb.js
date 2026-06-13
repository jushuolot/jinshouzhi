/// 压测真实数据批量写入：POST /api/nuanban/seed-load-test?key=nuanban_load_seed&offset=0&size=200
/// 手机号段 13910000000–13910009999（万人），可重复执行（按邮箱去重）

routerAdd("POST", "/api/nuanban/seed-load-test", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var SEED_KEY = "nuanban_load_seed";
  var PHONE_BASE = 13910000000;
  var q = e.request.url.query();
  if (q.get("key") !== SEED_KEY) {
    return e.json(400, { message: "缺少或错误的 key 参数" });
  }
  var offset = parseInt(q.get("offset") || "0", 10);
  var size = parseInt(q.get("size") || "200", 10);
  if (isNaN(offset) || offset < 0 || offset >= 10000) {
    return e.json(400, { message: "offset 须在 0–9999" });
  }
  if (isNaN(size) || size < 1 || size > 500) {
    return e.json(400, { message: "size 须在 1–500" });
  }
  if (offset + size > 10000) {
    size = 10000 - offset;
  }

  var stats = {
    users: 0,
    roles: 0,
    elders: 0,
    bindings: 0,
    orders: 0,
    schools: 0,
  };

  try {
    var DEV_PASS = "nuanban_dev_2025";
    var KNOWN = nb.KNOWN_SCHOOLS || ["示范大学"];

    function findOrCreateUser(email) {
      var rows = $app.findRecordsByFilter("users", "email = {:e}", "", 1, 0, { e: email });
      if (rows.length > 0) return rows[0];
      var col = $app.findCollectionByNameOrId("users");
      var u = new Record(col);
      u.set("email", email);
      u.setPassword(DEV_PASS);
      u.set("verified", true);
      u.set("name", "");
      $app.save(u);
      stats.users += 1;
      return u;
    }

    function findOrCreateRole(userId, role, extra) {
      var rows = $app.findRecordsByFilter(
        "user_roles",
        "user = {:uid} && role = {:r}",
        "",
        1,
        0,
        { uid: userId, r: role }
      );
      var rec;
      if (rows.length > 0) {
        rec = rows[0];
      } else {
        var col = $app.findCollectionByNameOrId("user_roles");
        rec = new Record(col);
        rec.set("user", userId);
        rec.set("role", role);
        stats.roles += 1;
      }
      rec.set("status", extra.status || "active");
      if (extra.display_name) rec.set("display_name", extra.display_name);
      if (extra.school) rec.set("school", extra.school);
      if (extra.latitude != null) rec.set("latitude", extra.latitude);
      if (extra.longitude != null) rec.set("longitude", extra.longitude);
      if (extra.elder_profile) rec.set("elder_profile", extra.elder_profile);
      if (extra.gender) rec.set("gender", extra.gender);
      $app.save(rec);
      return rec;
    }

    var orgRows = $app.findRecordsByFilter(
      "organizations",
      'name = "暖伴压测养老院"',
      "",
      1,
      0
    );
    var org;
    if (orgRows.length > 0) {
      org = orgRows[0];
    } else {
      var orgCol = $app.findCollectionByNameOrId("organizations");
      org = new Record(orgCol);
      org.set("name", "暖伴压测养老院");
      org.set("latitude", 31.23);
      org.set("longitude", 121.47);
      org.set("enabled", true);
      $app.save(org);
    }

    var svcRows = $app.findRecordsByFilter("service_items", 'name = "聊天陪伴"', "", 1, 0);
    var svcId = svcRows.length > 0 ? svcRows[0].id : null;
    if (!svcId) {
      return e.json(400, { message: "请先执行 ./scripts/seed-demo.sh 写入服务项目" });
    }

    for (var i = 0; i < size; i++) {
      var idx = offset + i;
      var phone = String(PHONE_BASE + idx);
      var email = "m" + phone + "@test.nuanban.dev";
      var bucket = idx % 100;
      var lat = 31.22 + (idx % 50) * 0.002;
      var lng = 121.46 + (idx % 50) * 0.002;
      var user = findOrCreateUser(email);

      if (bucket < 60) {
        var schoolName = KNOWN[idx % KNOWN.length];
        var school = nb.findOrCreateSchoolByName(schoolName);
        if (stats.schools === 0 && i === 0) stats.schools = 0;
        var stStatus = idx % 10 === 0 ? "pending" : "active";
        findOrCreateRole(user.id, "student", {
          status: stStatus,
          display_name: "压测学生" + idx,
          school: school.id,
          gender: idx % 2 === 0 ? "女" : "男",
          latitude: lat,
          longitude: lng,
        });
      } else if (bucket < 80) {
        var elderName = "压测老人" + idx;
        var eRows = $app.findRecordsByFilter("elders", "name = {:n}", "", 1, 0, { n: elderName });
        var elderRec;
        var elderGender = idx % 2 === 0 ? "女" : "男";
        if (eRows.length > 0) {
          elderRec = eRows[0];
          elderRec.set("gender", elderGender);
          $app.save(elderRec);
        } else {
          var eCol = $app.findCollectionByNameOrId("elders");
          elderRec = new Record(eCol);
          elderRec.set("org", org.id);
          elderRec.set("name", elderName);
          elderRec.set("latitude", lat);
          elderRec.set("longitude", lng);
          elderRec.set("enabled", true);
          elderRec.set("gender", elderGender);
          $app.save(elderRec);
          stats.elders += 1;
        }
        findOrCreateRole(user.id, "elder", {
          status: "active",
          display_name: elderName,
          elder_profile: elderRec.id,
        });
        if (idx % 5 === 0) {
          var oRows = $app.findRecordsByFilter(
            "orders",
            'elder = {:e} && status = "pending_accept"',
            "",
            1,
            0,
            { e: elderRec.id }
          );
          if (oRows.length === 0) {
            var oCol = $app.findCollectionByNameOrId("orders");
            var ord = new Record(oCol);
            ord.set("elder", elderRec.id);
            ord.set("service_item", svcId);
            ord.set("source", "family");
            ord.set("status", "pending_accept");
            ord.set("amount_cents", 5000);
            ord.set("payment_status", "paid");
            $app.save(ord);
            stats.orders += 1;
          }
        }
      } else {
        findOrCreateRole(user.id, "family", {
          status: "active",
          display_name: "压测家属" + idx,
        });
        var bindElderIdx = PHONE_BASE + (idx - (idx % 100) + 60 + (idx % 20));
        var bindPhone = String(bindElderIdx);
        var bindEmail = "m" + bindPhone + "@test.nuanban.dev";
        var bindUsers = $app.findRecordsByFilter("users", "email = {:e}", "", 1, 0, { e: bindEmail });
        if (bindUsers.length > 0) {
          var bindRoles = $app.findRecordsByFilter(
            "user_roles",
            'user = {:u} && role = "elder"',
            "",
            1,
            0,
            { u: bindUsers[0].id }
          );
          if (bindRoles.length > 0) {
            var ep = bindRoles[0].getString("elder_profile");
            if (ep) {
              var bRows = $app.findRecordsByFilter(
                "family_elder_bindings",
                "family_user = {:f} && elder = {:e}",
                "",
                1,
                0,
                { f: user.id, e: ep }
              );
              if (bRows.length === 0) {
                var bCol = $app.findCollectionByNameOrId("family_elder_bindings");
                var bind = new Record(bCol);
                bind.set("family_user", user.id);
                bind.set("elder", ep);
                bind.set("relation_label", "家属");
                bind.set("is_primary_payer", true);
                $app.save(bind);
                stats.bindings += 1;
              }
            }
          }
        }
      }
    }

    return e.json(200, {
      ok: true,
      offset: offset,
      size: size,
      nextOffset: offset + size < 10000 ? offset + size : null,
      phoneRange: [String(PHONE_BASE + offset), String(PHONE_BASE + offset + size - 1)],
      stats: stats,
    });
  } catch (err) {
    return e.json(400, {
      ok: false,
      message: String(err && err.message ? err.message : err),
    });
  }
});

routerAdd("GET", "/api/nuanban/platform/load-test/stats", function (e) {
  var SEED_KEY = "nuanban_load_seed";
  var q = e.request.url.query();
  if (q.get("key") !== SEED_KEY) {
    return e.json(400, { message: "缺少或错误的 key 参数" });
  }
  try {
    function countAll(col, filter) {
      return $app.findRecordsByFilter(col, filter, "", 50000, 0).length;
    }
    var userCount = countAll("users", 'email ~ "m1391000%"');
    var studentCount = countAll("user_roles", 'role = "student" && display_name ~ "压测学生"');
    var elderCount = countAll("user_roles", 'role = "elder" && display_name ~ "压测老人"');
    var familyCount = countAll("user_roles", 'role = "family" && display_name ~ "压测家属"');
    var pendingStudents = countAll(
      "user_roles",
      'role = "student" && status = "pending" && display_name ~ "压测学生"'
    );
    var pendingOrders = countAll("orders", 'status = "pending_accept"');
    var elderRecords = countAll("elders", 'name ~ "压测老人"');
    return e.json(200, {
      loadTestUsers: userCount,
      students: studentCount,
      elders: elderCount,
      families: familyCount,
      pendingStudents: pendingStudents,
      pendingOrders: pendingOrders,
      elderProfiles: elderRecords,
    });
  } catch (err) {
    return e.json(400, { message: String(err && err.message ? err.message : err) });
  }
});

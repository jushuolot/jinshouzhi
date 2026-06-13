/// 清空本地演示/压测数据：POST /api/nuanban/clear-demo?key=nuanban_dev_seed
/// 保留 PocketBase 超级管理员与集合结构

routerAdd("POST", "/api/nuanban/clear-demo", function (e) {
  var SEED_KEY = "nuanban_dev_seed";
  var q = e.request.url.query();
  if (q.get("key") !== SEED_KEY) {
    return e.json(400, { message: "缺少或错误的 key 参数" });
  }

  var stats = {};

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

  function deleteUsersByFilter(filter) {
    var n = 0;
    for (var round = 0; round < 500; round++) {
      var rows = $app.findRecordsByFilter("users", filter, "", 100, 0, {});
      if (!rows || rows.length === 0) break;
      for (var j = 0; j < rows.length; j++) {
        try {
          $app.delete(rows[j]);
          n += 1;
        } catch (_) {}
      }
    }
    return n;
  }

  try {
    var collections = [
      "wallet_transactions",
      "wallet_accounts",
      "withdrawals",
      "payment_accounts",
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

    stats.users_test = deleteUsersByFilter('email ~ "@test.nuanban.dev"');
    stats.users_wx = deleteUsersByFilter('email ~ "@nuanban.dev"');

    return e.json(200, {
      ok: true,
      message: "演示数据已清空",
      stats: stats,
      hint: "重新写入演示账号: ./scripts/seed-demo.sh  或  ./scripts/reset-demo.sh",
    });
  } catch (err) {
    return e.json(400, {
      ok: false,
      message: String(err && err.message ? err.message : err),
    });
  }
});

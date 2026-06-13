/// 清空全部业务数据与内存缓存：POST /api/nuanban/wipe-all?key=nuanban_dev_seed
/// 保留 PocketBase 超级管理员与集合结构；不写入演示 seed

routerAdd("POST", "/api/nuanban/wipe-all", function (e) {
  var nb = require(__hooks + "/nuanban_lib.js");
  var csms = require(__hooks + "/nuanban_captcha_sms.js");
  var WIPE_KEY = "nuanban_dev_seed";
  var q = e.request.url.query();
  if (q.get("key") !== WIPE_KEY) {
    return e.json(400, { message: "缺少或错误的 key 参数" });
  }

  try {
    var stats = nb.wipeAllCollections();
    stats.users = nb.deleteAllAuthUsers();
    nb.wipeAllRuntimeState();
    csms.wipeSmsCaptchaMemory();
    return e.json(200, {
      ok: true,
      message: "已全部清空：用户、订单、老人档案、服务项目、储值卡余额与内存缓存",
      stats: stats,
    });
  } catch (err) {
    return e.json(400, {
      ok: false,
      message: String(err && err.message ? err.message : err),
    });
  }
});

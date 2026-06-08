/**
 * 自主进化引擎 —— 无需人工调参，根据玩家表现自动优化体验。
 * 部署时更新 evolution.json 的 generation / patchNotes 即可记录版本进化史。
 */
(function () {
  "use strict";

  var DEFAULT = {
    version: "4.4.0",
    generation: 33,
    autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 },
    patchNotes: ["Gen.33 赞助变现", "六广告位+激励补给+开发者统计"],
  };

  window.MATCH3_EVOLUTION = DEFAULT;

  if (typeof fetch === "function") {
    fetch("evolution.json?v=" + Date.now())
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data) window.MATCH3_EVOLUTION = Object.assign({}, DEFAULT, data);
      })
      .catch(function () {});
  }
})();

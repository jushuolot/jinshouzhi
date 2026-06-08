/**
 * 自主进化引擎 —— 无需人工调参，根据玩家表现自动优化体验。
 * 部署时更新 evolution.json 的 generation / patchNotes 即可记录版本进化史。
 */
(function () {
  "use strict";

  var DEFAULT = {
    version: "5.6.1",
    generation: 49,
    universeDay: 2,
    autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 },
    patchNotes: ["Gen.49 宇宙第2日", "拌嘴日台词+晚间文物赏金"],
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

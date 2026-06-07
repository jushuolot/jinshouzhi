/**
 * 自主进化引擎 —— 无需人工调参，根据玩家表现自动优化体验。
 * 部署时更新 evolution.json 的 generation / patchNotes 即可记录版本进化史。
 */
(function () {
  "use strict";

  var DEFAULT = {
    version: "3.9.0",
    generation: 28,
    autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 },
    patchNotes: ["Gen.28 立绘可见性修复", "CSS flex 高度 + 旁白肖像"],
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

/**
 * 自主进化引擎 —— 无需人工调参，根据玩家表现自动优化体验。
 * 部署时更新 evolution.json 的 generation / patchNotes 即可记录版本进化史。
 */
(function () {
  "use strict";

  var DEFAULT = {
    version: "6.1.0",
    generation: 61,
    universeDay: 10,
    civilizationEpoch: "1929-07",
    civilizationDay: 61,
    civilizationYear: 2051,
    civilizationPhase: "超越期",
    dailyChronicle:
      "第 10 日·险情日。文明历 2051，坑壁渗水与头灯闪频被写进超越期险情档案。",
    autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 },
    patchNotes: ["Gen.61 · 第10日", "超越期 2051 · 险情巡更档案"],
  };

  window.MATCH3_EVOLUTION = DEFAULT;

  function onEvolutionLoaded(data) {
    if (data) window.MATCH3_EVOLUTION = Object.assign({}, DEFAULT, data);
    if (window.MATCH3_CIVILIZATION_CLOCK && window.MATCH3_CIVILIZATION_CLOCK.applyToSplash) {
      window.MATCH3_CIVILIZATION_CLOCK.applyToSplash(window.MATCH3_EVOLUTION);
    }
  }

  if (typeof fetch === "function") {
    fetch("evolution.json?v=" + Date.now())
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(onEvolutionLoaded)
      .catch(function () {});
  }
})();

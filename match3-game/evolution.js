/**
 * 自主进化引擎 —— 无需人工调参，根据玩家表现自动优化体验。
 * 部署时更新 evolution.json 的 generation / patchNotes 即可记录版本进化史。
 */
(function () {
  "use strict";

  var DEFAULT = {
    version: "6.0.0",
    generation: 61,
    universeDay: 10,
    civilizationEpoch: "1929-07",
    civilizationDay: 61,
    civilizationYear: 2051,
    civilizationPhase: "超越期",
    autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 },
    patchNotes: ["Gen.61 文明时钟", "超越期 2051 · 险情日巡检预警"],
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

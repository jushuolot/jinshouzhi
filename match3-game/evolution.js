/**
 * 自主进化引擎 —— 无需人工调参，根据玩家表现自动优化体验。
 * 部署时更新 evolution.json 的 generation / patchNotes 即可记录版本进化史。
 */
(function () {
  "use strict";

  var DEFAULT = {
    version: "5.9.3",
    generation: 59,
    universeDay: 8,
    civilizationEpoch: "1929-07",
    civilizationDay: 59,
    civilizationYear: 2047,
    civilizationPhase: "超越期",
    autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 },
    dailyChronicle:
      "第 8 日·下新坑。文明历 2047，新坑遥测上线，超越期层位板重新对齐金面与神树数据。",
    patchNotes: ["Gen.59 文明历 2047", "超越期新坑日台词", "新坑遥测档案寻金渠道"],
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

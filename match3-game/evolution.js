/**
 * 自主进化引擎 —— 无需人工调参，根据玩家表现自动优化体验。
 * 部署时更新 evolution.json 的 generation / patchNotes 即可记录版本进化史。
 */
(function () {
  "use strict";

  var DEFAULT = {
    version: "6.2.0",
    generation: 62,
    universeDay: 11,
    civilizationEpoch: "1929-07",
    civilizationDay: 62,
    civilizationYear: 2053,
    civilizationPhase: "超越期",
    dailyChronicle:
      "第 11 日·馋嘴/生活日。文明历 2053，营地灶火与陶盉炊烟样本被写入超越期日常档案。",
    autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 },
    patchNotes: ["Gen.62 文明时钟", "超越期 2053 · 馋嘴/生活日营地档案"],
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

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
    dailyChronicle:
      "第 8 日·下新坑。文明历 2047，此宇宙比人间又快进两年；清晨雾重，胡探把罗盘贴上新坑边线，杨雪用公开图鉴校准层位，王墩嫌早饭太素却还是第一个跳下探方。",
    autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 },
    patchNotes: [
      "Gen.59 · 宇宙第8日 · 下新坑 · 文明历 2047",
      "青铜门启新坑日对白刷新",
      "新坑简报寻金渠道",
    ],
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

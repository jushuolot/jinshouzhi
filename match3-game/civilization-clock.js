/**
 * 文明时钟 — 锚定 1929-07 燕道诚广汉首发现；每代进化 = 文明历加速推进
 */
(function () {
  "use strict";

  var ANCHOR = { year: 1929, month: 7, label: "1929-07" };
  /** 每代进化推进的文明年数（快于人间史） */
  var YEARS_PER_GENERATION = 2;

  var PHASES = [
    { id: "发现期", until: 1986 },
    { id: "苏醒期", until: 2021 },
    { id: "复兴期", until: 2040 },
    { id: "超越期", until: Infinity },
  ];

  function readEvolution() {
    if (typeof window !== "undefined" && window.MATCH3_EVOLUTION) {
      return window.MATCH3_EVOLUTION;
    }
    return {};
  }

  function computeYear(day) {
    return ANCHOR.year + Math.max(0, Number(day) || 0) * YEARS_PER_GENERATION;
  }

  function computePhase(year) {
    var y = Number(year) || ANCHOR.year;
    for (var i = 0; i < PHASES.length; i++) {
      if (y < PHASES[i].until) return PHASES[i].id;
    }
    return "超越期";
  }

  function resolveState(cfg) {
    cfg = cfg || readEvolution();
    var day =
      typeof cfg.civilizationDay === "number"
        ? cfg.civilizationDay
        : typeof cfg.generation === "number"
          ? cfg.generation
          : 0;
    var year =
      typeof cfg.civilizationYear === "number" ? cfg.civilizationYear : computeYear(day);
    var phase = cfg.civilizationPhase || computePhase(year);
    return {
      epoch: cfg.civilizationEpoch || ANCHOR.label,
      day: day,
      year: year,
      phase: phase,
      generation: cfg.generation || day,
      universeDay: cfg.universeDay || 1,
    };
  }

  function getCivilizationDate(cfg) {
    var s = resolveState(cfg);
    return {
      epoch: s.epoch,
      civilizationDay: s.day,
      civilizationYear: s.year,
      civilizationPhase: s.phase,
      label: s.year + "年 · " + s.phase,
      shortLabel: "文明历 " + s.year,
    };
  }

  function getPhase(cfg) {
    return resolveState(cfg).phase;
  }

  function formatForSplash(cfg) {
    var s = resolveState(cfg);
    return (
      "Gen." +
      s.generation +
      " · 第" +
      s.universeDay +
      "日" +
      " · 文明历 " +
      s.year +
      " · " +
      s.phase
    );
  }

  function formatForHome(cfg) {
    var s = resolveState(cfg);
    return (
      "🧬 Gen." +
      s.generation +
      " · 宇宙第" +
      s.universeDay +
      "日 · 发现后第" +
      s.day +
      "代 · " +
      s.year +
      "年 " +
      s.phase
    );
  }

  function applyToSplash(cfg) {
    if (typeof document === "undefined") return;
    var s = resolveState(cfg);
    var ver = document.querySelector(".boot-ver");
    if (ver) ver.textContent = formatForSplash(cfg);
    var tip = document.querySelector(".boot-tip");
    if (tip) {
      tip.textContent =
        "宇宙第" +
        s.universeDay +
        "日 · " +
        "文明历 " +
        s.year +
        " · " +
        s.phase +
        " · 此宇宙比人间快 " +
        YEARS_PER_GENERATION +
        " 倍";
    }
  }

  window.MATCH3_CIVILIZATION_CLOCK = {
    ANCHOR: ANCHOR,
    YEARS_PER_GENERATION: YEARS_PER_GENERATION,
    getCivilizationDate: getCivilizationDate,
    getPhase: getPhase,
    formatForSplash: formatForSplash,
    formatForHome: formatForHome,
    applyToSplash: applyToSplash,
    computeYear: computeYear,
    computePhase: computePhase,
    resolveState: resolveState,
  };

  applyToSplash();
})();

/**
 * 古蜀秘档 · 全网寻金渠道注册表
 *
 * 各渠道只记入账（virtualAccount.credit），禁止扣款。
 * 夜间进化 Agent 可 registerChannel() 扩展新来源，见 docs/DAILY_EVOLUTION.md
 */
(function () {
  "use strict";

  var STORAGE_KEY = "match3_network_earnings";
  var virtualAccount =
    typeof window !== "undefined" && window.MATCH3_VIRTUAL_ACCOUNT
      ? window.MATCH3_VIRTUAL_ACCOUNT
      : null;

  var CONFIG = {
    affiliate: { baseAmount: 0.028, chancePerSession: 0.4 },
    sponsorVisit: { bonusAmount: 0.12 },
    passiveYield: { dailyAmount: 0.006, sessionTickAmount: 0.0008, tickMs: 900000, sessionTickCap: 0.006 },
    relicBounty: { startHour: 18, endHour: 24, amount: 0.018 },
    civilizationArchive: { amount: 0.022, beyondAmount: 0.032, phases: ["复兴期", "超越期"] },
    publicCommonsMirror: { amount: 0.016, phases: ["超越期"] },
    beyondPhaseTick: { amount: 0.0014, sessionCap: 0.01, phases: ["超越期"] },
    weeklyRecap: { amount: 0.02, phases: ["超越期", "复兴期"] },
    newPitSurvey: { amount: 0.024, phases: ["超越期", "复兴期"] },
    bounty: {
      label: "任务赏金(演示)",
      endpoint: "https://api.coingecko.com/api/v3/ping",
      simulateAmount: 0.0025,
      timeoutMs: 4000,
    },
    faucet: {
      label: "公开水龙头(演示)",
      endpoint: "",
      simulateAmount: 0.0012,
      timeoutMs: 3000,
    },
  };

  /** @type {Record<string, {id:string,label:string,source:string,description?:string}>} */
  var registry = {
    ad_impression: {
      id: "ad_impression",
      label: "广告展示 CPM",
      source: "impression",
      description: "赞助位展示结算",
    },
    ad_click: {
      id: "ad_click",
      label: "广告点击 CPC",
      source: "click",
      description: "赞助位点击结算",
    },
    affiliate_referral: {
      id: "affiliate_referral",
      label: "联盟推荐",
      source: "affiliate",
      description: "模拟联盟引荐入账",
    },
    sponsor_visit: {
      id: "sponsor_visit",
      label: "赞助落地访问",
      source: "sponsor_visit",
      description: "访问赞助落地页奖励",
    },
    passive_yield: {
      id: "passive_yield",
      label: "网络驻场收益",
      source: "passive_yield",
      description: "每日/会话网络存在感微量收益",
    },
    bounty_demo: {
      id: "bounty_demo",
      label: "任务赏金(演示)",
      source: "bounty",
      description: "公开端点探测或模拟赏金入账",
    },
    faucet_demo: {
      id: "faucet_demo",
      label: "公开水龙头(演示)",
      source: "faucet_demo",
      description: "可配置水龙头端点，失败则模拟入账",
    },
    relic_bounty: {
      id: "relic_bounty",
      label: "文物晚间赏金",
      source: "bounty",
      description: "晚间上线探测古蜀档案，模拟文物赏金入账",
    },
    civilization_archive: {
      id: "civilization_archive",
      label: "文明档案赏金",
      source: "network_settlement",
      description: "文明历复兴期/超越期每日档案同步入账",
    },
    public_commons_mirror: {
      id: "public_commons_mirror",
      label: "公开资料镜像",
      source: "network_settlement",
      description: "超越期每日公开文物档案镜像入账",
    },
    beyond_phase_presence: {
      id: "beyond_phase_presence",
      label: "超越期驻场",
      source: "passive_yield",
      description: "超越期会话网络存在感微量收益",
    },
    weekly_recap: {
      id: "weekly_recap",
      label: "周复盘赏金",
      source: "network_settlement",
      description: "宇宙第七日收工复盘入账",
    },
    new_pit_survey: {
      id: "new_pit_survey",
      label: "新坑巡检",
      source: "network_settlement",
      description: "宇宙第二圈开铲时，同步新坑巡线档案入账",
    },
  };

  var state = {
    lastDailyYield: "",
    sessionTickTotal: 0,
    affiliateCredited: false,
    bountyCredited: false,
    faucetCredited: false,
    lastRelicBounty: "",
    lastCivilizationArchive: "",
    lastPublicCommonsMirror: "",
    beyondSessionTickTotal: 0,
    lastWeeklyRecap: "",
    lastNewPitSurvey: "",
  };

  var tickTimer = null;
  var onCreditHook = null;

  function roundMoney(n) {
    return Math.round(Number(n) * 1000) / 1000;
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      state.lastDailyYield = data.lastDailyYield || "";
      state.sessionTickTotal =
        typeof data.sessionTickTotal === "number" ? data.sessionTickTotal : 0;
      state.lastRelicBounty = data.lastRelicBounty || "";
      state.lastCivilizationArchive = data.lastCivilizationArchive || "";
      state.lastPublicCommonsMirror = data.lastPublicCommonsMirror || "";
      state.beyondSessionTickTotal =
        typeof data.beyondSessionTickTotal === "number" ? data.beyondSessionTickTotal : 0;
      state.lastWeeklyRecap = data.lastWeeklyRecap || "";
      state.lastNewPitSurvey = data.lastNewPitSurvey || "";
    } catch (e) {
      // ignore
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lastDailyYield: state.lastDailyYield,
          sessionTickTotal: state.sessionTickTotal,
          lastRelicBounty: state.lastRelicBounty,
          lastCivilizationArchive: state.lastCivilizationArchive,
          lastPublicCommonsMirror: state.lastPublicCommonsMirror,
          lastWeeklyRecap: state.lastWeeklyRecap,
          lastNewPitSurvey: state.lastNewPitSurvey,
          updatedAt: Date.now(),
        })
      );
    } catch (e) {
      // ignore
    }
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function registerChannel(id, def) {
    if (!id || !def || !def.source || !def.label) return false;
    registry[id] = Object.assign({ id: id }, def);
    return true;
  }

  function listChannels() {
    return Object.keys(registry).map(function (k) {
      return Object.assign({}, registry[k]);
    });
  }

  function creditChannel(channelId, opts) {
    opts = opts || {};
    var ch = registry[channelId];
    if (!ch || !virtualAccount) return 0;
    var amount = roundMoney(opts.amount || 0);
    if (!(amount > 0)) return 0;
    var credited = virtualAccount.credit({
      amount: amount,
      source: ch.source,
      slot: opts.slot || "",
      meta: Object.assign({ channel: channelId, channelLabel: ch.label }, opts.meta || {}),
    });
    if (credited > 0 && typeof onCreditHook === "function") {
      try {
        onCreditHook({ channelId: channelId, amount: credited, source: ch.source });
      } catch (e) {
        // ignore
      }
    }
    return credited;
  }

  function tryAffiliateReferral() {
    if (state.affiliateCredited) return 0;
    if (Math.random() > CONFIG.affiliate.chancePerSession) return 0;
    state.affiliateCredited = true;
    var code = "GS" + Math.floor(1000 + Math.random() * 9000);
    return creditChannel("affiliate_referral", {
      amount: CONFIG.affiliate.baseAmount,
      meta: { referralCode: code, simulated: true },
    });
  }

  function tryDailyPassiveYield() {
    var key = todayKey();
    if (state.lastDailyYield === key) return 0;
    state.lastDailyYield = key;
    saveState();
    return creditChannel("passive_yield", {
      amount: CONFIG.passiveYield.dailyAmount,
      meta: { kind: "daily", day: key },
    });
  }

  function trySessionTickYield() {
    var cap = CONFIG.passiveYield.sessionTickCap;
    if (state.sessionTickTotal >= cap) return 0;
    var amt = Math.min(CONFIG.passiveYield.sessionTickAmount, cap - state.sessionTickTotal);
    if (!(amt > 0)) return 0;
    state.sessionTickTotal = roundMoney(state.sessionTickTotal + amt);
    saveState();
    var credited = creditChannel("passive_yield", {
      amount: amt,
      meta: { kind: "session_tick" },
    });
    var clock =
      typeof window !== "undefined" && window.MATCH3_CIVILIZATION_CLOCK
        ? window.MATCH3_CIVILIZATION_CLOCK
        : null;
    if (clock && clock.getPhase() === "超越期") {
      var bcfg = CONFIG.beyondPhaseTick;
      if (bcfg && state.beyondSessionTickTotal < bcfg.sessionCap) {
        var bamt = Math.min(bcfg.amount, bcfg.sessionCap - state.beyondSessionTickTotal);
        if (bamt > 0) {
          state.beyondSessionTickTotal = roundMoney(state.beyondSessionTickTotal + bamt);
          saveState();
          credited += creditChannel("beyond_phase_presence", {
            amount: bamt,
            meta: { kind: "beyond_tick", year: clock.getCivilizationDate().civilizationYear },
          });
        }
      }
    }
    return credited;
  }

  function onSponsorVisit(slotKey) {
    return creditChannel("sponsor_visit", {
      amount: CONFIG.sponsorVisit.bonusAmount,
      slot: slotKey || "",
      meta: { action: "landing_visit" },
    });
  }

  function fetchWithTimeout(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = window.setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error("timeout"));
      }, timeoutMs || 4000);
      fetch(url, { method: "GET", mode: "cors" })
        .then(function (r) {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          resolve(r.ok);
        })
        .catch(function (err) {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          reject(err);
        });
    });
  }

  function tryBountyDemo() {
    if (state.bountyCredited) return Promise.resolve(0);
    state.bountyCredited = true;
    var cfg = CONFIG.bounty;
    var settle = function (mode) {
      return creditChannel("bounty_demo", {
        amount: cfg.simulateAmount,
        meta: { mode: mode, endpoint: cfg.endpoint || "simulated" },
      });
    };
    if (!cfg.endpoint || typeof fetch !== "function") {
      return Promise.resolve(settle("simulated"));
    }
    return fetchWithTimeout(cfg.endpoint, cfg.timeoutMs)
      .then(function () {
        return settle("network_probe");
      })
      .catch(function () {
        return settle("simulated_fallback");
      });
  }

  function tryFaucetDemo() {
    if (state.faucetCredited) return Promise.resolve(0);
    state.faucetCredited = true;
    var cfg = CONFIG.faucet;
    var settle = function (mode) {
      return creditChannel("faucet_demo", {
        amount: cfg.simulateAmount,
        meta: { mode: mode, endpoint: cfg.endpoint || "simulated" },
      });
    };
    if (!cfg.endpoint || typeof fetch !== "function") {
      return Promise.resolve(settle("simulated"));
    }
    return fetchWithTimeout(cfg.endpoint, cfg.timeoutMs)
      .then(function () {
        return settle("endpoint_ok");
      })
      .catch(function () {
        return settle("simulated_fallback");
      });
  }

  function tryRelicBounty() {
    var key = todayKey();
    if (state.lastRelicBounty === key) return 0;
    var cfg = CONFIG.relicBounty;
    var h = new Date().getHours();
    if (h < cfg.startHour || h >= cfg.endHour) return 0;
    state.lastRelicBounty = key;
    saveState();
    return creditChannel("relic_bounty", {
      amount: cfg.amount,
      meta: { kind: "evening", day: key, window: cfg.startHour + "-" + cfg.endHour },
    });
  }

  function tryCivilizationArchive() {
    var key = todayKey();
    if (state.lastCivilizationArchive === key) return 0;
    var clock =
      typeof window !== "undefined" && window.MATCH3_CIVILIZATION_CLOCK
        ? window.MATCH3_CIVILIZATION_CLOCK
        : null;
    if (!clock) return 0;
    var phase = clock.getPhase();
    var cfg = CONFIG.civilizationArchive;
    if (cfg.phases.indexOf(phase) < 0) return 0;
    state.lastCivilizationArchive = key;
    saveState();
    var amt = phase === "超越期" && cfg.beyondAmount ? cfg.beyondAmount : cfg.amount;
    var credited = creditChannel("civilization_archive", {
      amount: amt,
      meta: {
        kind: "civilization_sync",
        phase: phase,
        year: clock.getCivilizationDate().civilizationYear,
        day: key,
      },
    });
    if (credited > 0 && typeof window.showSystemToast === "function") {
      window.showSystemToast("📜 文明档案同步 · " + phase + " · 此间比人间快", 3600);
    }
    return credited;
  }

  function tryWeeklyRecap() {
    var evo = typeof window !== "undefined" && window.MATCH3_EVOLUTION ? window.MATCH3_EVOLUTION : {};
    var uday = evo.universeDay || 0;
    if (uday % 7 !== 0) return 0;
    var key = todayKey() + "-w" + uday;
    if (state.lastWeeklyRecap === key) return 0;
    var clock =
      typeof window !== "undefined" && window.MATCH3_CIVILIZATION_CLOCK
        ? window.MATCH3_CIVILIZATION_CLOCK
        : null;
    var phase = clock ? clock.getPhase() : "复兴期";
    var cfg = CONFIG.weeklyRecap;
    if (!cfg || cfg.phases.indexOf(phase) < 0) return 0;
    state.lastWeeklyRecap = key;
    saveState();
    var credited = creditChannel("weekly_recap", {
      amount: cfg.amount,
      meta: { kind: "weekly_recap", universeDay: uday, phase: phase },
    });
    if (credited > 0 && typeof window.showSystemToast === "function") {
      window.showSystemToast("📋 宇宙第" + uday + "日收工复盘 · 入账", 3600);
    }
    return credited;
  }

  function tryNewPitSurvey() {
    var evo = typeof window !== "undefined" && window.MATCH3_EVOLUTION ? window.MATCH3_EVOLUTION : {};
    var uday = Number(evo.universeDay) || 0;
    if (uday % 7 !== 1) return 0;
    var clock =
      typeof window !== "undefined" && window.MATCH3_CIVILIZATION_CLOCK
        ? window.MATCH3_CIVILIZATION_CLOCK
        : null;
    var phase = clock ? clock.getPhase(evo) : evo.civilizationPhase || "超越期";
    var cfg = CONFIG.newPitSurvey;
    if (!cfg || cfg.phases.indexOf(phase) < 0) return 0;
    var generation = Number(evo.generation) || 0;
    var key = todayKey() + "-g" + generation + "-u" + uday;
    if (state.lastNewPitSurvey === key) return 0;
    state.lastNewPitSurvey = key;
    saveState();
    var civ = clock
      ? clock.getCivilizationDate(evo)
      : { civilizationYear: evo.civilizationYear || "" };
    var credited = creditChannel("new_pit_survey", {
      amount: cfg.amount,
      meta: {
        kind: "new_pit_survey",
        generation: generation,
        universeDay: uday,
        phase: phase,
        year: civ.civilizationYear,
      },
    });
    if (credited > 0 && typeof window.showSystemToast === "function") {
      window.showSystemToast("🕳 新坑巡检档案同步 · 文明历 " + civ.civilizationYear + " · 入账", 3600);
    }
    return credited;
  }

  function tryPublicCommonsMirror() {
    var key = todayKey();
    if (state.lastPublicCommonsMirror === key) return 0;
    var clock =
      typeof window !== "undefined" && window.MATCH3_CIVILIZATION_CLOCK
        ? window.MATCH3_CIVILIZATION_CLOCK
        : null;
    if (!clock) return 0;
    var phase = clock.getPhase();
    var cfg = CONFIG.publicCommonsMirror;
    if (!cfg || cfg.phases.indexOf(phase) < 0) return 0;
    state.lastPublicCommonsMirror = key;
    saveState();
    var credited = creditChannel("public_commons_mirror", {
      amount: cfg.amount,
      meta: { kind: "commons_mirror", phase: phase, day: key },
    });
    if (credited > 0 && typeof window.showSystemToast === "function") {
      window.showSystemToast("📚 公开资料镜像入账 · 超越期 · Wikimedia 档", 3400);
    }
    return credited;
  }

  function startPeriodicTick() {
    if (tickTimer) return;
    var ms = CONFIG.passiveYield.tickMs;
    if (!(ms > 0)) return;
    tickTimer = window.setInterval(function () {
      trySessionTickYield();
    }, ms);
  }

  function deferNetworkProbes() {
    var run = function () {
      tryBountyDemo();
      tryFaucetDemo();
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(run, { timeout: 6000 });
    } else {
      window.setTimeout(run, 3000);
    }
  }

  function onSessionStart() {
    loadState();
    tryDailyPassiveYield();
    tryRelicBounty();
    tryCivilizationArchive();
    tryPublicCommonsMirror();
    tryWeeklyRecap();
    tryNewPitSurvey();
    tryAffiliateReferral();
    startPeriodicTick();
    deferNetworkProbes();
  }

  function setOnCredit(fn) {
    onCreditHook = typeof fn === "function" ? fn : null;
  }

  function getConfig() {
    return Object.assign({}, CONFIG);
  }

  window.MATCH3_NETWORK_EARNINGS = {
    CONFIG: CONFIG,
    registerChannel: registerChannel,
    listChannels: listChannels,
    creditChannel: creditChannel,
    onSessionStart: onSessionStart,
    onSponsorVisit: onSponsorVisit,
    setOnCredit: setOnCredit,
    getConfig: getConfig,
  };

  loadState();
})();

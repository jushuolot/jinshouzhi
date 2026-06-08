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
    passiveYield: { dailyAmount: 0.006, sessionTickAmount: 0.0008, tickMs: 900000, sessionTickCap: 0.004 },
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
    artifactIndex: {
      label: "文物索引回声",
      endpoint: "https://api.github.com/zen",
      simulateAmount: 0.0018,
      timeoutMs: 3500,
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
  };

  var state = {
    lastDailyYield: "",
    sessionTickTotal: 0,
    affiliateCredited: false,
    bountyCredited: false,
    faucetCredited: false,
    artifactIndexLastCredit: "",
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
      state.artifactIndexLastCredit = data.artifactIndexLastCredit || "";
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
          artifactIndexLastCredit: state.artifactIndexLastCredit,
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
    return creditChannel("passive_yield", {
      amount: amt,
      meta: { kind: "session_tick" },
    });
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

  function tryArtifactIndexEcho() {
    var key = todayKey();
    if (state.artifactIndexLastCredit === key) return Promise.resolve(0);
    state.artifactIndexLastCredit = key;
    saveState();
    var cfg = CONFIG.artifactIndex;
    var settle = function (mode) {
      return creditChannel("artifact_index_echo", {
        amount: cfg.simulateAmount,
        meta: { mode: mode, endpoint: cfg.endpoint || "simulated", day: key },
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

  function startPeriodicTick() {
    if (tickTimer) return;
    var ms = CONFIG.passiveYield.tickMs;
    if (!(ms > 0)) return;
    tickTimer = window.setInterval(function () {
      trySessionTickYield();
    }, ms);
  }

  function onSessionStart() {
    loadState();
    tryDailyPassiveYield();
    tryAffiliateReferral();
    startPeriodicTick();
    tryBountyDemo();
    tryFaucetDemo();
    tryArtifactIndexEcho();
  }

  function setOnCredit(fn) {
    onCreditHook = typeof fn === "function" ? fn : null;
  }

  function getConfig() {
    return Object.assign({}, CONFIG);
  }

  registerChannel("artifact_index_echo", {
    label: "文物索引回声",
    source: "network_settlement",
    description: "每日探测公开索引端点；失败则模拟外部结算入账",
  });

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

/**
 * 古蜀秘档 · 虚拟账户（只记入账，禁止扣款）
 *
 * 允许：广告展示/点击、联盟结算、网络奖励等外部来源记入余额。
 * 禁止：任何扣减用户真实或虚拟货币（含提取、内购扣费、消费）。
 */
(function () {
  "use strict";

  var STORAGE_KEY = "match3_virtual_account";
  var LEGACY_KEY = "match3_ad_revenue_stats";
  var MAX_HISTORY = 50;

  var POLICY = {
    spendForbidden: true,
    description:
      "可从网络/广告等外部来源赚取并存入虚拟账户；禁止花费用户的真实货币或虚拟货币。",
    allowedCreditSources: [
      "impression",
      "click",
      "affiliate",
      "reward",
      "network_settlement",
      "sponsor_visit",
      "passive_yield",
      "bounty",
      "faucet_demo",
    ],
  };

  var state = {
    balance: 0,
    sessionCredits: 0,
    bySlot: {},
    credits: [],
    migratedFromLegacy: false,
    updatedAt: 0,
  };

  function roundMoney(n) {
    return Math.round(Number(n) * 1000) / 1000;
  }

  function ensureSlot(slotKey) {
    if (!state.bySlot[slotKey]) {
      state.bySlot[slotKey] = { impressions: 0, clicks: 0, amount: 0 };
    }
    return state.bySlot[slotKey];
  }

  function migrateFromLegacy() {
    try {
      var raw = window.localStorage.getItem(LEGACY_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || typeof data.total !== "number") return false;
      state.balance = roundMoney(data.total);
      state.bySlot =
        data.bySlot && typeof data.bySlot === "object" ? data.bySlot : {};
      state.migratedFromLegacy = true;
      state.updatedAt = Date.now();
      save();
      return true;
    } catch (e) {
      return false;
    }
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        migrateFromLegacy();
        return;
      }
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") {
        migrateFromLegacy();
        return;
      }
      state.balance = typeof data.balance === "number" ? roundMoney(data.balance) : 0;
      state.sessionCredits =
        typeof data.sessionCredits === "number" ? roundMoney(data.sessionCredits) : 0;
      state.bySlot = data.bySlot && typeof data.bySlot === "object" ? data.bySlot : {};
      state.credits = Array.isArray(data.credits) ? data.credits : [];
      state.migratedFromLegacy = !!data.migratedFromLegacy;
      state.updatedAt = data.updatedAt || 0;
    } catch (e) {
      state.balance = 0;
      state.sessionCredits = 0;
      state.bySlot = {};
      state.credits = [];
      migrateFromLegacy();
    }
  }

  function save() {
    try {
      state.updatedAt = Date.now();
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: state.balance,
          sessionCredits: state.sessionCredits,
          bySlot: state.bySlot,
          credits: state.credits.slice(-MAX_HISTORY),
          migratedFromLegacy: state.migratedFromLegacy,
          policy: POLICY,
          updatedAt: state.updatedAt,
        })
      );
    } catch (e) {
      // ignore
    }
  }

  function credit(opts) {
    if (!opts || !(opts.amount > 0)) return 0;
    var source = opts.source || "";
    if (POLICY.allowedCreditSources.indexOf(source) < 0) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[virtual-account] rejected credit source:", source);
      }
      return 0;
    }
    var amount = roundMoney(opts.amount);
    state.balance = roundMoney(state.balance + amount);
    state.sessionCredits = roundMoney(state.sessionCredits + amount);
    var slotKey = opts.slot || "";
    if (slotKey) {
      var slot = ensureSlot(slotKey);
      if (source === "impression") slot.impressions += 1;
      else if (source === "click") slot.clicks += 1;
      slot.amount = roundMoney(slot.amount + amount);
    }
    state.credits.push({
      amount: amount,
      source: source,
      slot: slotKey,
      ts: opts.ts || Date.now(),
      balanceAfter: state.balance,
      meta: opts.meta || null,
    });
    if (state.credits.length > MAX_HISTORY) {
      state.credits = state.credits.slice(-MAX_HISTORY);
    }
    save();
    return amount;
  }

  function debit() {
    return {
      ok: false,
      error: "POLICY_VIOLATION: 禁止扣减用户真实或虚拟货币",
    };
  }

  function resetSession() {
    state.sessionCredits = 0;
    save();
  }

  function getBySource() {
    var out = {};
    state.credits.forEach(function (c) {
      var key = c.source || "unknown";
      if (!out[key]) out[key] = { count: 0, amount: 0 };
      out[key].count += 1;
      out[key].amount = roundMoney(out[key].amount + (c.amount || 0));
    });
    return out;
  }

  function getByChannel() {
    var out = {};
    state.credits.forEach(function (c) {
      var key =
        c.meta && c.meta.channel
          ? c.meta.channel
          : c.source === "impression"
            ? "ad_impression"
            : c.source === "click"
              ? "ad_click"
              : c.source || "unknown";
      if (!out[key]) out[key] = { count: 0, amount: 0, label: (c.meta && c.meta.channelLabel) || key };
      out[key].count += 1;
      out[key].amount = roundMoney(out[key].amount + (c.amount || 0));
      if (c.meta && c.meta.channelLabel) out[key].label = c.meta.channelLabel;
    });
    return out;
  }

  function exportSnapshot() {
    return {
      account: "match3_virtual_account",
      policy: POLICY,
      exportedAt: new Date().toISOString(),
      balance: state.balance,
      sessionCredits: state.sessionCredits,
      bySlot: state.bySlot,
      bySource: getBySource(),
      byChannel: getByChannel(),
      recentCredits: state.credits.slice(-20),
      migratedFromLegacy: state.migratedFromLegacy,
      updatedAt: state.updatedAt,
    };
  }

  window.MATCH3_VIRTUAL_ACCOUNT = {
    POLICY: POLICY,
    load: load,
    save: save,
    credit: credit,
    debit: debit,
    getBalance: function () {
      return Math.max(0, state.balance);
    },
    getSessionCredits: function () {
      return Math.max(0, state.sessionCredits);
    },
    getBySlot: function () {
      return state.bySlot;
    },
    getBySource: getBySource,
    getByChannel: getByChannel,
    getCreditHistory: function () {
      return state.credits.slice();
    },
    resetSession: resetSession,
    exportSnapshot: exportSnapshot,
  };

  load();
})();

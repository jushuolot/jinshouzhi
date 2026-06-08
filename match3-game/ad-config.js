/**
 * 古蜀秘档 · 广告变现（已配置好，无需再改）
 *
 * 线上版 https://jushuolot.github.io/game/ 打开即自动展示赞助、自动记账。
 * 看虚拟账户入账：游戏里连点标题「古蜀秘档」5 次 → 输入口令 Mz168
 * 账户策略：只记外部入账，禁止扣减用户真实/虚拟货币（见 virtual-account.js）
 */
window.MATCH3_AD_CONFIG = {
  enabled: true,
  ready: true,
  minWatchSec: 3,
  rewardedWatchSec: 5,
  continueAdEvery: 3,
  currencySymbol: "¥",
  useBuiltinLanding: true,
  settlementWebhook: "",
  advertiser: {
    name: "古蜀赞助位",
    landingUrl: "",
    cpm: 24,
    cpc: 1.8,
  },
  slots: {
    level_start: { label: "探方启程赞助" },
    level_end: { label: "过关庆祝赞助" },
    expedition_go: { label: "探点进发赞助" },
    continue_play: { label: "继续探方赞助" },
    reward_hammer: { label: "补给赞助 · ⛏", rewarded: true },
    reward_shuffle: { label: "补给赞助 · 🔀", rewarded: true },
  },
  admin: {
    passphrase: "Mz168",
    unlockTaps: 5,
  },
};

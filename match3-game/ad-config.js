/**
 * 古蜀秘档 · 广告变现配置
 *
 * 玩家界面不显示收益；开发者：连点标题 5 次 → 口令 Mz168
 * 本地结算服务：cd ad-server && npm start  → POST localhost:3920/settle
 */
window.MATCH3_AD_CONFIG = {
  enabled: true,
  minWatchSec: 3,
  rewardedWatchSec: 5,
  /** 每 N 次「继续探方」展示一次 continue_play 赞助 */
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

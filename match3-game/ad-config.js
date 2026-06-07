/**
 * 广告变现配置
 *
 * 默认 useBuiltinLanding: true —— 无需淘宝客/联盟链接，游戏自带赞助落地页。
 * 有真实外链后：设 useBuiltinLanding: false，并填写 advertiser.landingUrl。
 */
window.MATCH3_AD_CONFIG = {
  enabled: true,
  minWatchSec: 3,
  currencySymbol: "¥",
  useBuiltinLanding: true,
  settlementWebhook: "",
  advertiser: {
    name: "内置赞助位",
    landingUrl: "",
    cpm: 20,
    cpc: 1.5,
  },
  slots: {
    level_start: { label: "关头广告" },
    level_end: { label: "关尾广告" },
  },
  /** 隐藏管理后台：连续点击标题若干次后输入口令 */
  admin: {
    passphrase: "Mz168",
    unlockTaps: 5,
  },
};

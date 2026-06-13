/** 暖伴 · 产品模块地图（单源定义，供模块总览页与文档对齐） */

export type ModuleGroupId = 'elder' | 'family' | 'student' | 'platform' | 'security';

export interface ModuleEntry {
  id: string;
  title: string;
  desc: string;
  icon: string;
  path: string;
  /** 演示账号提示 */
  account?: string;
  highlight?: boolean;
}

export interface ModuleGroup {
  id: ModuleGroupId;
  title: string;
  subtitle: string;
  color: string;
  entries: ModuleEntry[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: 'elder',
    title: '老人端',
    subtitle: '大字号 · 一键求助 · 找陪护',
    color: '#c45c26',
    entries: [
      { id: 'elder-home', title: '首页', desc: '订单概览 · 储值卡 · 快捷服务', icon: '🏠', path: '/package-elder/home', account: '已注册手机号' },
      { id: 'elder-care', title: '找陪护', desc: '附近大学生 · 预约服务', icon: '🤝', path: '/package-elder/caregivers/list' },
      { id: 'elder-orders', title: '我的服务', desc: '进行中与历史订单', icon: '📋', path: '/package-elder/order/list' },
      { id: 'elder-logs', title: '服务记录', desc: '已完成归档', icon: '📝', path: '/package-elder/service/log' },
      { id: 'elder-wallet', title: '储值卡', desc: '余额 · 充值 · 抵扣', icon: '💰', path: '/package-elder/wallet/index', highlight: true },
      { id: 'elder-sos', title: '一键求助', desc: '通知家属与学生', icon: '🆘', path: '/package-elder/home' },
    ],
  },
  {
    id: 'family',
    title: '家属端',
    subtitle: '代付 · 审批 · 绑定老人',
    color: '#2e7d6e',
    entries: [
      { id: 'family-home', title: '家属中心', desc: '待办 · 动态 · 绑定', icon: '🏡', path: '/package-family/home', account: '已注册手机号' },
      { id: 'family-pay', title: '待支付', desc: '储值卡 / 微信支付', icon: '💳', path: '/package-family/order/list', highlight: true },
      { id: 'family-outdoor', title: '外出审批', desc: '陪同散步 / 就医确认', icon: '🚶', path: '/package-family/outdoor/approve' },
      { id: 'family-logs', title: '服务记录', desc: '绑定老人归档', icon: '📝', path: '/package-family/service/log' },
      { id: 'family-package', title: '服务包', desc: '机构套餐购买', icon: '📦', path: '/package-family/package/buy' },
      { id: 'family-wallet', title: '储值卡', desc: '代付余额管理', icon: '💰', path: '/package-family/wallet/index' },
    ],
  },
  {
    id: 'student',
    title: '学生端',
    subtitle: '接单 · 签到 · 收入',
    color: '#5c6bc0',
    entries: [
      { id: 'student-home', title: '学生首页', desc: '待接 · 收入 · 提现', icon: '🎓', path: '/package-student/home', account: '已注册手机号' },
      { id: 'student-pending', title: '待接单', desc: '待接单池 · 一键接单', icon: '📋', path: '/package-student/order/pending', highlight: true },
      { id: 'student-active', title: '服务中', desc: '签到 · 完成服务', icon: '🧑‍⚕️', path: '/package-student/order/active' },
      { id: 'student-discover', title: '附近老人', desc: '地图 / 列表发现', icon: '📍', path: '/package-student/discover/list' },
      { id: 'student-income', title: '收入明细', desc: '结算与月报', icon: '💰', path: '/package-student/income' },
      { id: 'student-referral', title: '推荐有奖', desc: '邀请同学加入', icon: '🎁', path: '/package-student/referral/index' },
    ],
  },
  {
    id: 'platform',
    title: '运营管理',
    subtitle: '撮合 KPI · 派单 · 档案',
    color: '#6d4c9a',
    entries: [
      { id: 'guide', title: '深度验收向导', desc: '9 步闭环 · 进度保存', icon: '🧭', path: '/pages/common/scenario-guide', highlight: true },
      { id: 'admin', title: '运营台', desc: '口令 · KPI · 派单', icon: '📊', path: '/pages/common/ops-gate' },
      { id: 'dispatch', title: '机构派单', desc: '指定学生接单', icon: '🏢', path: '/pages/common/org-dispatch' },
      { id: 'tour', title: '动画演示', desc: '22 秒五幕', icon: '🎬', path: '/pages/common/demo-tour' },
      { id: 'share', title: '分享链接', desc: '复制给验收人', icon: '🔗', path: '/pages/common/share-demo' },
    ],
  },
  {
    id: 'security',
    title: '安全与合规',
    subtitle: '传输加密 · 权限隔离',
    color: '#455a64',
    entries: [
      { id: 'security-center', title: '安全中心', desc: '加密状态 · 隐私说明', icon: '🔒', path: '/pages/common/security', highlight: true },
      { id: 'agreement', title: '用户协议', desc: '服务与免责', icon: '📜', path: '/pages/common/agreement' },
    ],
  },
];

export const PRODUCT_PILLARS = [
  { icon: '⚡', title: '便捷', desc: '三端分包 · 待办直达 · 一键验收' },
  { icon: '🔒', title: '安全', desc: 'HTTPS 传输 · 角色鉴权 · 敏感操作确认' },
  { icon: '🧩', title: '清晰', desc: '模块地图 · 状态时间线 · 订单进度条' },
  { icon: '✨', title: '美观', desc: '暖色设计系统 · 老人大字号模式' },
] as const;

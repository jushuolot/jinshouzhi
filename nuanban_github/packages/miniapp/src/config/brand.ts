/** 品牌文案 — 登录页、上帝视角、平台看板等统一引用 */
export const APP_TITLE = '暖伴勤工';
export const APP_VERSION = '1.0';
export const APP_VERSION_LABEL = 'v1.0';
export const APP_VERSION_LINE = '暖伴勤工 v1.0';
export const APP_TAGLINE = '让陪伴有温度，让勤工有意义';
export const COPYRIGHT_LINE = '© 2026 暖伴勤工 v1.0 · 保留所有权利';
/** 品牌色 — 从 login-bg-kawaii 提取的柔和暖色盘 */
export const BRAND_PEACH = '#fff5eb';
export const BRAND_CREAM = '#fff8f0';
export const BRAND_CREAM_DEEP = '#ffefe0';
export const BRAND_PAGE_BG = '#faf7f4';
export const BRAND_SURFACE = '#ffffff';
export const BRAND_SURFACE_MUTED = '#faf7f4';

export const BRAND_PRIMARY = '#c45c26';
export const BRAND_PRIMARY_LIGHT = '#e88b4a';
export const BRAND_PRIMARY_SOFT = '#fff5ef';
export const BRAND_BG = BRAND_CREAM;
export const BRAND_BG_DEEP = BRAND_CREAM_DEEP;

export const BRAND_TEXT = '#3d2a1f';
export const BRAND_TEXT_SECONDARY = '#6b5748';
export const BRAND_TEXT_MUTED = '#a89488';
export const BRAND_TEXT_PLACEHOLDER = '#b8a99e';

export const BRAND_BORDER = '#f0e6dc';
export const BRAND_BORDER_LIGHT = '#ebe0d6';
export const BRAND_BORDER_DASHED = '#e8c4a8';

/** 深色页（上帝视角 / 动画演示）— 暖调暗色 + 珊瑚强调 */
export const BRAND_DARK_BG = '#1f1a24';
export const BRAND_DARK_SURFACE = '#2a2330';
export const BRAND_DARK_SURFACE_ALT = '#352d3a';
export const BRAND_DARK_TEXT = '#f0ebe6';
export const BRAND_DARK_TEXT_MUTED = '#b8a99e';

/** 圆角与阴影 token（供 JS / 文档引用） */
export const BRAND_RADIUS_LG = '28rpx';
export const BRAND_RADIUS_MD = '16rpx';
export const BRAND_RADIUS_SM = '12rpx';
export const BRAND_SHADOW_CARD = '0 12rpx 48rpx rgba(61, 42, 31, 0.08)';
export const BRAND_SHADOW_SOFT = '0 4rpx 16rpx rgba(61, 42, 31, 0.06)';

/** CSS 变量名映射 — 与 theme.css 同步 */
export const THEME_CSS_VARS = {
  '--nb-peach': BRAND_PEACH,
  '--nb-cream': BRAND_CREAM,
  '--nb-cream-deep': BRAND_CREAM_DEEP,
  '--nb-page-bg': BRAND_PAGE_BG,
  '--nb-surface': BRAND_SURFACE,
  '--nb-surface-muted': BRAND_SURFACE_MUTED,
  '--nb-primary': BRAND_PRIMARY,
  '--nb-primary-light': BRAND_PRIMARY_LIGHT,
  '--nb-primary-soft': BRAND_PRIMARY_SOFT,
  '--nb-text': BRAND_TEXT,
  '--nb-text-secondary': BRAND_TEXT_SECONDARY,
  '--nb-text-muted': BRAND_TEXT_MUTED,
  '--nb-text-placeholder': BRAND_TEXT_PLACEHOLDER,
  '--nb-border': BRAND_BORDER,
  '--nb-border-light': BRAND_BORDER_LIGHT,
  '--nb-border-dashed': BRAND_BORDER_DASHED,
  '--nb-dark-bg': BRAND_DARK_BG,
  '--nb-dark-surface': BRAND_DARK_SURFACE,
  '--nb-dark-surface-alt': BRAND_DARK_SURFACE_ALT,
  '--nb-dark-text': BRAND_DARK_TEXT,
  '--nb-dark-text-muted': BRAND_DARK_TEXT_MUTED,
} as const;

export type RoleKey = 'elder' | 'family' | 'student';

export interface TabItem {
  text: string;
  pagePath: string;
  icon?: string;
}

export const ROLE_TABS: Record<RoleKey, TabItem[]> = {
  elder: [
    { text: '首页', pagePath: '/package-elder/home' },
    { text: '服务', pagePath: '/package-elder/order/list' },
    { text: '我的', pagePath: '/package-elder/profile' },
  ],
  family: [
    { text: '首页', pagePath: '/package-family/home' },
    { text: '订单', pagePath: '/package-family/order/list' },
    { text: '我的', pagePath: '/package-family/profile' },
  ],
  student: [
    { text: '首页', pagePath: '/package-student/home' },
    { text: '接单', pagePath: '/package-student/order/pending' },
    { text: '发现', pagePath: '/package-student/discover/list' },
    { text: '我的', pagePath: '/package-student/profile' },
  ],
};

export const ROLE_HOME: Record<RoleKey, string> = {
  elder: '/package-elder/home',
  family: '/package-family/home',
  student: '/package-student/home',
};

/** 深链 target → 路径 */
export const DEEP_LINK_MAP: Record<string, { role: RoleKey; path: (id?: string) => string }> = {
  'order-pay': {
    role: 'family',
    path: (id) => `/package-family/order/pay?id=${id ?? ''}`,
  },
  'order-request': {
    role: 'student',
    path: (id) => `/package-student/order/request?id=${id ?? ''}`,
  },
  'order-detail': {
    role: 'elder',
    path: (id) => `/package-elder/order/detail?id=${id ?? ''}`,
  },
  'outdoor-approve': {
    role: 'family',
    path: (id) => `/package-family/outdoor/approve?id=${id ?? ''}`,
  },
  'family-order': {
    role: 'family',
    path: (id) => `/package-family/order/detail?id=${id ?? ''}`,
  },
  'family-bind': {
    role: 'family',
    path: (id) => `/package-family/bind?code=${encodeURIComponent(id ?? '')}`,
  },
};

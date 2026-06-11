export interface OpsTabItem {
  key: string;
  text: string;
  pagePath: string;
  icon: string;
}

export const OPS_TABS: OpsTabItem[] = [
  { key: 'overview', text: '概览', pagePath: '/pages/common/ops-home', icon: '📊' },
  { key: 'students', text: '学生', pagePath: '/pages/common/student-profiles', icon: '🎓' },
  { key: 'dispatch', text: '派单', pagePath: '/pages/common/org-dispatch', icon: '🏢' },
  { key: 'funds', text: '资金', pagePath: '/pages/common/fund-admin', icon: '💰' },
  { key: 'more', text: '更多', pagePath: '/pages/common/ops-more', icon: '⋯' },
];

export const OPS_HOME_PATH = '/pages/common/ops-home';

export const OPS_SHELL_ROUTE_KEYS = [
  'ops-home',
  'student-profiles',
  'org-dispatch',
  'fund-admin',
  'ops-more',
] as const;

import { request } from '../utils/request';

export interface MatchingPathStatus {
  id: string;
  label: string;
  description: string;
  status: 'live' | 'demo' | 'planned';
  metric: string;
  metricValue: number | string;
}

export interface PlatformOverview {
  mission: string;
  updatedAt: string;
  eldersTotal: number;
  studentsActive: number;
  ordersPendingAccept: number;
  ordersPendingPayment?: number;
  ordersInService: number;
  ordersCompleted: number;
  walletPaidTotalCents?: number;
  walletPaidTotalYuan?: string;
  caregiversNearby: number;
  eldersNearby: number;
  todayMatches: number;
  matchSuccessRatePct: number;
  matchingPaths: MatchingPathStatus[];
  coreCompletionPct: number;
  auditStatus: string;
  demoUrl: string;
}

export async function fetchPlatformOverview() {
  return request<PlatformOverview>({
    url: '/nuanban/platform/overview',
    method: 'GET',
  });
}

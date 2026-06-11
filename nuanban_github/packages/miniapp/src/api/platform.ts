import { request } from '../utils/request';
import type { ActivityEvent } from '../utils/demo-activity';

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
  serviceLogCount?: number;
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

export async function fetchPlatformActivity() {
  const res = await request<{ list: ActivityEvent[] }>({
    url: '/nuanban/platform/activity',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function seedDemoScenario() {
  return request<{
    ok: boolean;
    orderId: string;
    elderName: string;
    serviceName: string;
  }>({
    url: '/nuanban/platform/seed-scenario',
    method: 'POST',
  });
}

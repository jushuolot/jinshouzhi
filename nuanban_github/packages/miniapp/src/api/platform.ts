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
  ordersPendingConfirm?: number;
  ordersInService: number;
  ordersCompleted: number;
  studentsPendingCount?: number;
  sosActiveCount?: number;
  pendingWithdrawalCount?: number;
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

export interface OpsStudentProfile {
  userId: string;
  displayName: string;
  nickname: string;
  email: string;
  schoolName: string;
  status: string;
  cartoonAvatarId?: string;
  avatarUrl?: string;
  verificationPhotoUrl?: string;
  major?: string;
  grade?: string;
  phone?: string;
  gender?: string;
}

export interface OpsStudentListResult {
  list: OpsStudentProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function fetchOpsStudentProfiles(opts?: {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'active' | 'rejected';
}) {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 50;
  const status = opts?.status;
  let url = `/nuanban/platform/students?page=${page}&pageSize=${pageSize}`;
  if (status) url += `&status=${status}`;
  const res = await request<OpsStudentListResult>({
    url,
    method: 'GET',
  });
  return {
    list: res.list ?? [],
    total: res.total ?? res.list?.length ?? 0,
    page: res.page ?? page,
    pageSize: res.pageSize ?? pageSize,
    hasMore: res.hasMore ?? false,
  };
}

export async function updateOpsStudentStatus(userId: string, status: 'active' | 'rejected' | 'pending') {
  return request<{ ok: boolean; userId: string; status: string }>({
    url: `/nuanban/platform/students/${userId}/status`,
    method: 'POST',
    data: { status },
  });
}

export interface OpsSosAlert {
  id: string;
  elderId: string;
  elderName?: string;
  message: string;
  status: string;
  createdAt: string;
}

export async function fetchOpsSosActive() {
  const res = await request<{ list: OpsSosAlert[] }>({
    url: '/nuanban/platform/sos/active',
    method: 'GET',
  });
  return res.list ?? [];
}

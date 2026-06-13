import { API_BASE, request } from '../utils/request';
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
  customCartoonAvatarUrl?: string;
  contactPhone?: string;
  studentId?: string;
  serviceAreaPolygons?: import('../utils/service-area-geo').ServiceAreaPolygon[];
  serviceHours?: string[];
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
  q?: string;
}) {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 50;
  const status = opts?.status;
  const q = opts?.q?.trim();
  let url = `/nuanban/platform/students?page=${page}&pageSize=${pageSize}`;
  if (status) url += `&status=${status}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
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

export interface OpsOrganization {
  id: string;
  name: string;
}

export interface OpsElderProfile {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  loginPhone?: string;
  avatarUrl?: string;
  age?: number;
  gender?: string;
  address?: string;
  orgId: string;
  orgName: string;
  district: string;
  livingSituation: string;
  healthStatus: string;
  mobility: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  enabled: boolean;
  orgProfileComplete: boolean;
}

export interface OpsElderListResult {
  list: OpsElderProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function fetchOpsOrganizations() {
  const res = await request<{ list: OpsOrganization[] }>({
    url: '/nuanban/platform/organizations',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function fetchOpsElderProfiles(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
  incomplete?: boolean;
}) {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 50;
  const q = opts?.q?.trim();
  let url = `/nuanban/platform/elders?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (opts?.incomplete) url += '&incomplete=1';
  const res = await request<OpsElderListResult>({ url, method: 'GET' });
  return {
    list: res.list ?? [],
    total: res.total ?? res.list?.length ?? 0,
    page: res.page ?? page,
    pageSize: res.pageSize ?? pageSize,
    hasMore: res.hasMore ?? false,
  };
}

export async function fetchOpsElderProfile(elderId: string) {
  return request<OpsElderProfile>({
    url: `/nuanban/platform/elders/${elderId}`,
    method: 'GET',
  });
}

export async function updateOpsElderProfile(
  elderId: string,
  data: {
    name?: string;
    phone?: string;
    age?: number;
    gender?: string;
    address?: string;
    orgId?: string;
    orgName?: string;
    district?: string;
    livingSituation?: string;
    healthStatus?: string;
    mobility?: string;
    emergencyContactName?: string;
    emergencyContactRelation?: string;
    emergencyContactPhone?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  return request<{ ok: boolean; elder: OpsElderProfile }>({
    url: `/nuanban/platform/elders/${elderId}`,
    method: 'PATCH',
    data,
  });
}

export async function uploadOpsElderAvatar(elderId: string, filePath: string) {
  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE}/nuanban/platform/elders/${elderId}/avatar`,
      filePath,
      name: 'avatar',
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data as string) as { avatarUrl?: string };
            resolve(data.avatarUrl || filePath);
          } catch (err) {
            reject(err);
          }
          return;
        }
        try {
          reject(JSON.parse(res.data as string));
        } catch {
          reject(new Error(`上传失败 HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => reject(err),
    });
  });
}

export interface SchoolCoopGroup {
  orgId: string;
  orgName: string;
  schools: string[];
  items: Array<{
    id: string;
    schoolId: string;
    schoolName: string;
    orgId: string;
    orgName: string;
    enabled: boolean;
  }>;
}

export async function fetchSchoolCooperationGroups() {
  const res = await request<{ groups: SchoolCoopGroup[]; total: number }>({
    url: '/nuanban/platform/school-cooperation',
    method: 'GET',
  });
  return res.groups ?? [];
}

export async function addSchoolCooperation(orgId: string, schoolName: string) {
  return request<{ ok: boolean; item: SchoolCoopGroup['items'][0] }>({
    url: '/nuanban/platform/school-cooperation',
    method: 'POST',
    data: { orgId, schoolName },
  });
}

export async function disableSchoolCooperation(id: string) {
  return request<{ ok: boolean }>({
    url: `/nuanban/platform/school-cooperation/${id}/disable`,
    method: 'POST',
  });
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  priceCents: number;
  priceYuan: string;
  durationMinutes: number;
  requiresOutdoorApproval: boolean;
  enabled: boolean;
}

export interface ServiceCatalogCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: ServiceCatalogItem[];
}

export interface ServiceCatalog {
  categories: ServiceCatalogCategory[];
  uncategorized: ServiceCatalogItem[];
  totalItems: number;
  enabledCount: number;
}

export async function fetchServiceCatalog() {
  return request<ServiceCatalog>({
    url: '/nuanban/platform/service-catalog',
    method: 'GET',
  });
}

export async function createServiceCategory(name: string, sortOrder?: number) {
  return request<{ ok: boolean; category: Omit<ServiceCatalogCategory, 'items'> }>({
    url: '/nuanban/platform/service-categories',
    method: 'POST',
    data: { name, sortOrder },
  });
}

export async function createServiceItem(data: {
  categoryId: string;
  name: string;
  priceCents: number;
  durationMinutes?: number;
  requiresOutdoorApproval?: boolean;
  enabled?: boolean;
}) {
  return request<{ ok: boolean; item: ServiceCatalogItem }>({
    url: '/nuanban/platform/service-items',
    method: 'POST',
    data,
  });
}

export async function updateServiceItem(
  id: string,
  data: {
    categoryId?: string;
    name?: string;
    priceCents?: number;
    durationMinutes?: number;
    requiresOutdoorApproval?: boolean;
    enabled?: boolean;
  },
) {
  return request<{ ok: boolean; item: ServiceCatalogItem }>({
    url: `/nuanban/platform/service-items/${id}`,
    method: 'PATCH',
    data,
  });
}

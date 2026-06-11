import { normalizeElderId } from '../utils/elder-id';
import { request } from '../utils/request';
import { useRoleStore } from '../store/role';
import { pbList, type PbRecord } from './pb';

export interface CaregiverItem {
  id: string;
  userId?: string;
  name: string;
  school: string;
  distance: string;
  distanceKm?: number;
  tags?: string[];
  rating?: number;
  orderCount?: number;
  intro?: string;
}

export interface CaregiverProfileDetail {
  id: string;
  userId: string;
  name: string;
  school: string;
  distance?: string;
  distanceKm?: number;
  rating: number;
  orderCount: number;
  intro: string;
  tags: string[];
  gender: string;
  major: string;
  grade: string;
  age: number;
  phone: string;
  bio: string;
  serviceAreas: string[];
  availableHours: string[];
  certifications: string[];
  languages: string[];
  personalityTags: string[];
  serviceTypes: string[];
  completedOrderThemes: string[];
  reviewSummary: string;
}

export interface ElderSelfProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  profileComplete?: boolean;
  age: number;
  gender: string;
  district: string;
  address: string;
  orgName: string;
  healthStatus: string;
  mobility: string;
  hobbies: string[];
  servicePreferences: string[];
  livingSituation: string;
  emergencyContact: { name: string; relation: string; phone: string };
  preferredVisitTimes: string[];
  notes: string;
}

export interface ElderStats {
  elderProfileId: string | null;
  elderName: string;
  orderCount: number;
  activeCount: number;
  caregiverNearbyCount?: number;
}

export async function fetchElderStats() {
  return request<ElderStats>({
    url: '/nuanban/elder/stats',
    method: 'GET',
  });
}

/** 列表/下单用：优先 store，缺失时从 stats 回填 elderProfileId */
export async function resolveElderIdForApi(): Promise<string | null> {
  const roleStore = useRoleStore();
  const fromStore = roleStore.currentElderId;
  if (fromStore) return normalizeElderId(fromStore);
  if (roleStore.activeRole !== 'elder') return null;
  try {
    const stats = await fetchElderStats();
    if (stats.elderProfileId) {
      roleStore.setElderProfileId(stats.elderProfileId);
      return normalizeElderId(stats.elderProfileId);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function getNearbyCaregivers(lat: number, lng: number, radiusKm = 5) {
  const res = await request<{ list: CaregiverItem[] }>({
    url: `/nuanban/elder/caregivers/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`,
    method: 'GET',
  });
  return res.list ?? [];
}

export async function getCaregiverDetail(id: string) {
  return request<CaregiverProfileDetail>({
    url: `/nuanban/elder/caregivers/${id}`,
    method: 'GET',
  });
}

export async function fetchElderSelfProfile() {
  return request<ElderSelfProfile>({
    url: '/nuanban/elder/profile',
    method: 'GET',
  });
}

export async function updateElderProfile(data: {
  name?: string;
  age?: number;
  gender?: string;
  district?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}) {
  return request<{ ok: boolean; profileComplete?: boolean } & Partial<ElderSelfProfile>>({
    url: '/nuanban/elder/profile',
    method: 'PATCH',
    data,
  });
}

export interface ServiceItemRow extends PbRecord {
  name: string;
  price_cents: number;
  duration_minutes?: number;
  requires_outdoor_approval?: boolean;
  enabled?: boolean;
  category?: string;
  expand?: { category?: { id: string; name: string } };
}

export async function listServiceItems() {
  const res = await pbList<ServiceItemRow>('service_items', {
    filter: 'enabled = true',
    sort: 'name',
    expand: 'category',
    perPage: 50,
  });
  return res.items;
}

export interface CreateOrderInput {
  elderId: string;
  serviceItemId: string;
  studentId?: string;
  scheduledAt?: string;
  requirePayment?: boolean;
}

export async function createOrder(input: CreateOrderInput) {
  return request<{ id: string; status: string }>({
    url: '/nuanban/elder/orders',
    method: 'POST',
    data: {
      elderId: input.elderId,
      serviceItemId: input.serviceItemId,
      studentId: input.studentId,
      scheduledAt: input.scheduledAt,
      requirePayment: input.requirePayment,
    },
  });
}

export interface OrderRow extends PbRecord {
  status: string;
  elder: string;
  service_item: string;
  amount_cents?: number;
  scheduled_at?: string;
}

export async function listOrdersForElder(elderId: string) {
  const eid = normalizeElderId(elderId);
  const res = await pbList<
    OrderRow & {
      expand?: { service_item?: { name: string; requires_outdoor_approval?: boolean } };
    }
  >('orders', {
    filter: `elder = "${eid}"`,
    expand: 'service_item',
    perPage: 30,
  });
  return res.items;
}

export interface ElderServiceLogItem {
  id: string;
  orderId: string;
  elderId: string;
  elderName: string;
  serviceName: string;
  summary: string;
  createdAt: string;
}

export async function listElderServiceLogs() {
  const res = await request<{ list: ElderServiceLogItem[] }>({
    url: '/nuanban/elder/service-logs',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function getOrder(id: string) {
  const res = await pbList<
    OrderRow & {
      payment_status?: string;
      expand?: {
        service_item?: { name: string; requires_outdoor_approval?: boolean };
      };
    }
  >('orders', {
    filter: `id = "${id}"`,
    expand: 'service_item',
    perPage: 1,
  });
  return res.items[0] ?? null;
}

export async function confirmOrderComplete(orderId: string, payMethod?: 'wallet') {
  return request<{ ok: boolean; status: string; payment_status?: string }>({
    url: `/nuanban/elder/orders/${orderId}/confirm-complete`,
    method: 'POST',
    data: payMethod ? { payMethod } : undefined,
  });
}

export async function triggerSos(elderId: string, message?: string) {
  return request<{ id: string; ok: boolean }>({
    url: '/nuanban/elder/sos',
    method: 'POST',
    data: { elderId, message: message || '老人发起一键求助' },
  });
}

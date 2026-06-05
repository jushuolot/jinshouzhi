import { request } from '../utils/request';
import { pbList, type PbRecord } from './pb';

export interface PendingOrder {
  id: string;
  elderId: string;
  elderName?: string;
  serviceName?: string;
  durationMinutes?: number;
  amountCents?: number;
  scheduledAt?: string;
  status: string;
  requiresOutdoorApproval?: boolean;
  distanceKm?: number;
}

export interface StudentOrderDetail extends PendingOrder {
  elderIntro?: string;
  orgName?: string;
}

export interface IncomeRecord {
  id: string;
  elderName: string;
  serviceName: string;
  amountCents: number;
  completedAt: string;
}

export interface StudentIncome {
  monthIncomeCents: number;
  monthIncomeYuan: string;
  totalIncomeCents: number;
  totalIncomeYuan: string;
  records: IncomeRecord[];
}

export interface SosAlert {
  id: string;
  elderId: string;
  elderName: string;
  message: string;
  createdAt: string;
  status: string;
}

export interface StudentProfile {
  nickname: string;
  email: string;
  schoolName: string;
  displayName: string;
}

export interface StudentStats {
  acceptedCount: number;
  monthCount: number;
  pendingCount?: number;
  incomeCents: number;
  incomeYuan: string;
}

export async function fetchStudentProfile() {
  return request<StudentProfile>({
    url: '/nuanban/student/profile',
    method: 'GET',
  });
}

export async function fetchStudentStats() {
  return request<StudentStats>({
    url: '/nuanban/student/stats',
    method: 'GET',
  });
}

export async function listPendingOrders() {
  const res = await request<{ list: PendingOrder[] }>({
    url: '/nuanban/student/orders/pending',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function acceptOrder(orderId: string) {
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/student/order-requests/${orderId}/accept`,
    method: 'POST',
  });
}

export async function rejectOrder(orderId: string, reason?: string) {
  return request<{ ok: boolean }>({
    url: `/nuanban/student/order-requests/${orderId}/reject`,
    method: 'POST',
    data: { reason: reason || '时间冲突' },
  });
}

export async function getStudentOrder(orderId: string) {
  return request<StudentOrderDetail>({
    url: `/nuanban/student/orders/${orderId}`,
    method: 'GET',
  });
}

export async function listActiveOrders() {
  const res = await request<{ list: PendingOrder[] }>({
    url: '/nuanban/student/orders/active',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function startOrder(orderId: string) {
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/student/orders/${orderId}/start`,
    method: 'POST',
  });
}

export async function completeOrder(orderId: string) {
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/student/orders/${orderId}/complete`,
    method: 'POST',
  });
}

export async function fetchStudentIncome() {
  return request<StudentIncome>({
    url: '/nuanban/student/income',
    method: 'GET',
  });
}

export async function listActiveSosAlerts() {
  const res = await request<{ list: SosAlert[] }>({
    url: '/nuanban/student/sos/active',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function acknowledgeSosAlert(alertId: string) {
  return request<{ ok: boolean }>({
    url: `/nuanban/student/sos/${alertId}/ack`,
    method: 'POST',
  });
}

export interface ElderRow extends PbRecord {
  name: string;
  latitude?: number;
  longitude?: number;
  org?: string;
  expand?: { org?: { id: string; name: string } };
}

export async function getElderDetail(id: string) {
  const res = await pbList<ElderRow>('elders', {
    filter: `id = "${id}"`,
    expand: 'org',
    perPage: 1,
  });
  return res.items[0] ?? null;
}

/** Nearby elders stub: active elders with coordinates */
export async function listNearbyElders(lat: number, lng: number, radiusKm = 5) {
  const res = await pbList<ElderRow>('elders', {
    filter: 'enabled = true',
    expand: 'org',
    perPage: 50,
  });
  const R = 6371;
  return res.items
    .map((e) => {
      const elat = e.latitude as number | undefined;
      const elng = e.longitude as number | undefined;
      let km = 999;
      if (lat && lng && elat && elng) {
        const dLat = ((elat - lat) * Math.PI) / 180;
        const dLng = ((elng - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((elat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      return { ...e, distanceKm: km };
    })
    .filter((e) => e.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

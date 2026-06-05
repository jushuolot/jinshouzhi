import { request } from '../utils/request';
import { pbList, type PbRecord } from './pb';

export interface CaregiverItem {
  id: string;
  userId?: string;
  name: string;
  school: string;
  distance: string;
  distanceKm?: number;
}

export interface ElderStats {
  elderProfileId: string | null;
  elderName: string;
  orderCount: number;
  activeCount: number;
}

export async function fetchElderStats() {
  return request<ElderStats>({
    url: '/nuanban/elder/stats',
    method: 'GET',
  });
}

export async function getNearbyCaregivers(lat: number, lng: number, radiusKm = 5) {
  const res = await request<{ list: CaregiverItem[] }>({
    url: `/nuanban/elder/caregivers/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`,
    method: 'GET',
  });
  return res.list ?? [];
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
  const res = await pbList<OrderRow>('orders', {
    filter: `elder = "${elderId}"`,
    perPage: 30,
  });
  return res.items;
}

export async function getOrder(id: string) {
  const res = await pbList<OrderRow>('orders', {
    filter: `id = "${id}"`,
    perPage: 1,
  });
  return res.items[0] ?? null;
}

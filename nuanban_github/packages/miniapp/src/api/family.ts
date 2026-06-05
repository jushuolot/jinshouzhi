import { request } from '../utils/request';
import { pbCreate, pbList, type PbRecord } from './pb';

export interface FamilyStats {
  boundElderCount: number;
  pendingPaymentCount: number;
  outdoorPendingCount?: number;
  sosPendingCount?: number;
  paidTotalCents: number;
  paidTotalYuan: string;
}

export interface SosAlert {
  id: string;
  elderId: string;
  elderName: string;
  message: string;
  createdAt: string;
  status: string;
}

export async function fetchFamilyStats() {
  return request<FamilyStats>({
    url: '/nuanban/family/stats',
    method: 'GET',
  });
}

export async function payOrder(orderId: string) {
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/family/orders/${orderId}/pay`,
    method: 'POST',
  });
}

export async function approveOutdoor(orderId: string, approved: boolean, reason?: string) {
  return request<{ ok: boolean; approved: boolean }>({
    url: `/nuanban/family/outdoor/${orderId}/approve`,
    method: 'POST',
    data: { approved, reason },
  });
}

export async function bindElder(familyUserId: string, elderId: string, relationLabel?: string) {
  return pbCreate('family_elder_bindings', {
    family_user: familyUserId,
    elder: elderId,
    relation_label: relationLabel || '家属',
    is_primary_payer: true,
  });
}

export async function listBoundElders(familyUserId: string) {
  const bindings = await pbList<BindingRow>('family_elder_bindings', {
    filter: `family_user = "${familyUserId}"`,
    expand: 'elder',
    perPage: 20,
  });
  return bindings.items;
}

interface BindingRow extends PbRecord {
  elder: string;
  expand?: { elder?: { id: string; name: string } };
}

export async function listPendingOutdoorApprovals(familyUserId: string) {
  const res = await pbList<OutdoorApprovalRow>('outdoor_approvals', {
    filter: `family_user = "${familyUserId}" && status = "pending_family"`,
    expand: 'order,order.elder,order.service_item',
    perPage: 20,
  });
  return res.items;
}

interface OutdoorApprovalRow extends PbRecord {
  order: string;
  status: string;
  expand?: {
    order?: {
      id: string;
      scheduled_at?: string;
      amount_cents?: number;
      expand?: {
        elder?: { id: string; name: string };
        service_item?: { id: string; name: string };
      };
    };
  };
}

export async function listPendingPaymentOrders(elderIds: string[]) {
  if (!elderIds.length) return [];
  const filter = elderIds.map((id) => `elder = "${id}"`).join(' || ');
  const res = await pbList<OrderRow>('orders', {
    filter: `(${filter}) && status = "pending_payment"`,
    expand: 'elder,service_item',
    perPage: 20,
  });
  return res.items;
}

interface OrderRow extends PbRecord {
  status: string;
  elder: string;
  amount_cents?: number;
  scheduled_at?: string;
  expand?: {
    elder?: { id: string; name: string };
    service_item?: { id: string; name: string };
  };
}

export async function listActiveSosAlerts() {
  const res = await request<{ list: SosAlert[] }>({
    url: '/nuanban/family/sos/active',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function acknowledgeSosAlert(alertId: string) {
  return request<{ ok: boolean }>({
    url: `/nuanban/family/sos/${alertId}/ack`,
    method: 'POST',
  });
}

export interface FamilyOrderDetail {
  id: string;
  status: string;
  amount_cents?: number;
  scheduled_at?: string;
  payment_status?: string;
  elderName?: string;
  serviceName?: string;
  requiresOutdoorApproval?: boolean;
}

export async function getFamilyOrder(orderId: string) {
  return request<FamilyOrderDetail>({
    url: `/nuanban/family/orders/${orderId}`,
    method: 'GET',
  });
}

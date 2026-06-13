import { request } from '../utils/request';

export interface DispatchOrderItem {
  id: string;
  elderName: string;
  serviceName: string;
  scheduledAt?: string;
  amountCents?: number;
  status: string;
}

export async function listDispatchableOrders() {
  const res = await request<{ list: DispatchOrderItem[] }>({
    url: '/nuanban/org/orders/dispatchable',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function dispatchOrder(orderId: string, studentUserId: string) {
  if (!studentUserId) {
    throw new Error('请选择学生');
  }
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/org/orders/${orderId}/dispatch`,
    method: 'POST',
    data: { studentUserId },
  });
}

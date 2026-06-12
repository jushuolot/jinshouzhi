import { request } from '../utils/request';

export interface OrderChatMessage {
  id: string;
  orderId: string;
  senderRole: string;
  senderAlias: string;
  body: string;
  createdAt: string;
  mine?: boolean;
}

export async function fetchOrderMessages(orderId: string) {
  const res = await request<{ list: OrderChatMessage[]; threadOpen: boolean }>({
    url: `/nuanban/orders/${orderId}/messages`,
    method: 'GET',
  });
  return res;
}

export async function sendOrderMessage(orderId: string, body: string) {
  return request<{ ok: boolean; message: OrderChatMessage }>({
    url: `/nuanban/orders/${orderId}/messages`,
    method: 'POST',
    data: { body },
  });
}

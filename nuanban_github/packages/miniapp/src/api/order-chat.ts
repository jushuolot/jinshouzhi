import { request } from '../utils/request';

export type OrderChatMessageType = 'text' | 'voice';

export interface OrderChatMessage {
  id: string;
  orderId: string;
  senderRole: string;
  senderAlias: string;
  type?: OrderChatMessageType;
  body: string;
  /** 语音时长（秒） */
  durationSec?: number;
  /** 可播放地址（data URL 或文件 URL） */
  audioUrl?: string;
  createdAt: string;
  mine?: boolean;
}

export async function fetchOrderMessages(orderId: string) {
  const res = await request<{ list: OrderChatMessage[]; threadOpen: boolean; callOpen?: boolean }>({
    url: `/nuanban/orders/${orderId}/messages`,
    method: 'GET',
  });
  return res;
}

export async function sendOrderMessage(orderId: string, body: string) {
  return request<{ ok: boolean; message: OrderChatMessage }>({
    url: `/nuanban/orders/${orderId}/messages`,
    method: 'POST',
    data: { type: 'text', body },
  });
}

export async function sendOrderVoiceMessage(
  orderId: string,
  audioBase64: string,
  durationSec: number,
  mimeType = 'audio/mpeg',
) {
  return request<{ ok: boolean; message: OrderChatMessage }>({
    url: `/nuanban/orders/${orderId}/messages`,
    method: 'POST',
    data: { type: 'voice', audioBase64, durationSec, mimeType },
    timeout: 60000,
  });
}

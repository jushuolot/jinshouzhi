import { request } from '../utils/request';

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface OrderCallInfo {
  callOpen: boolean;
  mode?: 'webrtc' | 'pstn';
  roomId?: string;
  iceServers?: IceServerConfig[];
  clientId?: string;
  maskedNumber: string;
  maskedNumberDisplay: string;
  peerAlias: string;
  hint: string;
  callId?: string;
  loggedAt?: string;
}

export type CallSignalType = 'offer' | 'answer' | 'ice' | 'hangup' | 'join';

export interface CallSignal {
  seq: number;
  fromUser: string;
  clientId: string;
  type: CallSignalType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  at: string;
}

export interface CallSignalPollResult {
  signals: CallSignal[];
  since: number;
  roomId?: string;
  status?: string;
}

export async function fetchOrderCallInfo(orderId: string) {
  return request<OrderCallInfo>({
    url: `/nuanban/orders/${orderId}/call`,
    method: 'GET',
  });
}

export async function initiateOrderCall(orderId: string) {
  return request<OrderCallInfo>({
    url: `/nuanban/orders/${orderId}/call`,
    method: 'POST',
  });
}

export async function pollOrderCallSignals(orderId: string, clientId: string, since = 0) {
  const qs = new URLSearchParams({ clientId, since: String(since) }).toString();
  return request<CallSignalPollResult>({
    url: `/nuanban/orders/${orderId}/call/signal?${qs}`,
    method: 'GET',
  });
}

export async function postOrderCallSignal(
  orderId: string,
  body: {
    type: CallSignalType;
    clientId: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  },
) {
  return request<{ ok: boolean; signal: CallSignal }>({
    url: `/nuanban/orders/${orderId}/call/signal`,
    method: 'POST',
    data: body,
  });
}

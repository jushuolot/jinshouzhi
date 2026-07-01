import { request } from '../utils/request';

export interface CaptchaTile {
  id: string;
  emoji: string;
}

export interface CaptchaChallenge {
  challengeId: string;
  prompt: string;
  tiles: CaptchaTile[];
  expiresIn: number;
}

export interface SmsSendResult {
  ok: boolean;
  message?: string;
  expiresIn?: number;
  devCode?: string;
  devHint?: string;
  deliveryId?: string;
}

export async function fetchCaptchaChallenge() {
  return request<CaptchaChallenge>({
    url: '/nuanban/captcha/challenge',
    method: 'GET',
  });
}

export async function verifyCaptchaChallenge(challengeId: string, selectedIds: string[]) {
  return request<{ ok: boolean; captchaToken?: string; message?: string; expiresIn?: number }>({
    url: '/nuanban/captcha/verify',
    method: 'POST',
    data: { challengeId, selectedIds },
  });
}

export async function sendSelfHostedSms(phone: string, captchaToken: string) {
  return request<SmsSendResult>({
    url: '/nuanban/sms/send',
    method: 'POST',
    data: { phone, captchaToken },
  });
}

export async function receiveSmsDelivery(phone: string, deliveryId: string) {
  return request<{ ready: boolean; code?: string }>({
    url: `/nuanban/sms/receive?phone=${encodeURIComponent(phone)}&deliveryId=${encodeURIComponent(deliveryId)}`,
    method: 'GET',
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 轮询领取自建通道验证码（正式环境用户端自动收码） */
export async function pollSmsDelivery(
  phone: string,
  deliveryId: string,
  maxAttempts = 16,
  intervalMs = 400,
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await sleep(intervalMs);
    try {
      const res = await receiveSmsDelivery(phone, deliveryId);
      if (res.ready && res.code) return res.code;
    } catch {
      // 首轮可能尚未就绪，继续轮询
    }
  }
  return null;
}

export async function fetchSmsOutbox(opsKey: string) {
  return request<{
    list: Array<{ phone: string; code: string; sentAt: string; channel: string }>;
  }>({
    url: `/nuanban/platform/sms-outbox?key=${encodeURIComponent(opsKey)}`,
    method: 'GET',
  });
}

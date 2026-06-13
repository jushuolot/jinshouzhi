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
  return request<{
    ok: boolean;
    message?: string;
    expiresIn?: number;
    devCode?: string;
    devHint?: string;
  }>({
    url: '/nuanban/sms/send',
    method: 'POST',
    data: { phone, captchaToken },
  });
}

export async function fetchSmsOutbox(opsKey: string) {
  return request<{
    list: Array<{ phone: string; code: string; sentAt: string; channel: string }>;
  }>({
    url: `/nuanban/platform/sms-outbox?key=${encodeURIComponent(opsKey)}`,
    method: 'GET',
  });
}

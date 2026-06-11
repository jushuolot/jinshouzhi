import type { RoleKey } from '../config/tabs';
import { request } from '../utils/request';

export type PaymentAccountProvider = 'saobei';

export interface PaymentAccount {
  provider: PaymentAccountProvider;
  configured: boolean;
  accountLabel?: string;
  merchantNo?: string;
  accountName?: string;
}

export interface BindPaymentAccountPayload {
  provider: PaymentAccountProvider;
  merchantNo?: string;
  accountName?: string;
}

export async function fetchPaymentAccount(role: RoleKey) {
  return request<PaymentAccount>({
    url: `/nuanban/${role}/payment-account`,
    method: 'GET',
  });
}

export async function bindPaymentAccount(role: RoleKey, payload: BindPaymentAccountPayload) {
  return request<PaymentAccount>({
    url: `/nuanban/${role}/payment-account`,
    method: 'POST',
    data: payload,
  });
}

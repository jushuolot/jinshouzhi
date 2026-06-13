import { request } from '../utils/request';
import type { WalletOverview, WalletTransaction } from '../utils/demo-wallet';

export type { WalletOverview, WalletTransaction };

export async function fetchFamilyWallet() {
  return request<WalletOverview>({
    url: '/nuanban/family/wallet',
    method: 'GET',
  });
}

export async function topupFamilyWallet(amountCents: number) {
  return request<WalletOverview>({
    url: '/nuanban/family/wallet/topup',
    method: 'POST',
    data: { amountCents },
  });
}

export async function payFamilyOrderWithWallet(orderId: string) {
  return request<{ ok: boolean; status?: string; overview: WalletOverview }>({
    url: '/nuanban/family/wallet/pay-order',
    method: 'POST',
    data: { orderId },
  });
}

export async function fetchElderWallet() {
  return request<WalletOverview>({
    url: '/nuanban/elder/wallet',
    method: 'GET',
  });
}

export async function topupElderWallet(amountCents: number) {
  return request<WalletOverview>({
    url: '/nuanban/elder/wallet/topup',
    method: 'POST',
    data: { amountCents },
  });
}

export async function payElderOrderWithWallet(orderId: string) {
  return request<{ ok: boolean; status?: string; overview: WalletOverview }>({
    url: '/nuanban/elder/wallet/pay-order',
    method: 'POST',
    data: { orderId },
  });
}

import { request } from '../utils/request';

export interface FundOverview {
  totalBalanceCents: number;
  totalBalanceYuan: string;
  topupTotalCents: number;
  topupTotalYuan: string;
  paymentTotalCents: number;
  paymentTotalYuan: string;
  pendingWithdrawalCents: number;
  pendingWithdrawalYuan: string;
  pendingWithdrawalCount: number;
  unreconciledCount: number;
  updatedAt: string;
}

export interface AdminTopupRecord {
  id: string;
  userId: string;
  userName: string;
  role: 'family' | 'elder' | 'student';
  amountCents: number;
  label: string;
  createdAt: string;
  reconciled: boolean;
}

export interface AdminPaymentRecord {
  id: string;
  userId: string;
  userName: string;
  role: 'family' | 'elder' | 'student';
  amountCents: number;
  label: string;
  orderId?: string;
  createdAt: string;
  reconciled: boolean;
}

export interface AdminWithdrawalRecord {
  id: string;
  userId: string;
  studentName: string;
  amountCents: number;
  channel: 'wechat' | 'bank';
  channelLabel: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
  rejectReason?: string;
}

export async function fetchFundOverview() {
  return request<FundOverview>({
    url: '/nuanban/platform/funds/overview',
    method: 'GET',
  });
}

export async function fetchFundTopups(reconciled?: boolean) {
  const res = await request<{ list: AdminTopupRecord[] }>({
    url: '/nuanban/platform/funds/topups',
    method: 'GET',
    data: reconciled !== undefined ? { reconciled: String(reconciled) } : undefined,
  });
  return res.list ?? [];
}

export async function fetchFundPayments(reconciled?: boolean) {
  const res = await request<{ list: AdminPaymentRecord[] }>({
    url: '/nuanban/platform/funds/payments',
    method: 'GET',
    data: reconciled !== undefined ? { reconciled: String(reconciled) } : undefined,
  });
  return res.list ?? [];
}

export async function fetchFundWithdrawals(status?: AdminWithdrawalRecord['status']) {
  const res = await request<{ list: AdminWithdrawalRecord[] }>({
    url: '/nuanban/platform/funds/withdrawals',
    method: 'GET',
    data: status ? { status } : undefined,
  });
  return res.list ?? [];
}

export async function approveFundWithdrawal(withdrawalId: string) {
  return request<{ ok: boolean; record: AdminWithdrawalRecord | null }>({
    url: `/nuanban/platform/funds/withdrawals/${withdrawalId}/approve`,
    method: 'POST',
  });
}

export async function rejectFundWithdrawal(withdrawalId: string, reason?: string) {
  return request<{ ok: boolean; record: AdminWithdrawalRecord | null }>({
    url: `/nuanban/platform/funds/withdrawals/${withdrawalId}/reject`,
    method: 'POST',
    data: { reason },
  });
}

export async function reconcileFundRecord(recordId: string) {
  return request<{ ok: boolean }>({
    url: '/nuanban/platform/funds/reconcile',
    method: 'POST',
    data: { recordId },
  });
}

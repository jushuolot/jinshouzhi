/** 演示栈 · 运营端资金管理（聚合储值/支付/提现，对账与审批） */

import { DEMO_USERS } from './demo-rich-data';
import { getWalletOverview } from './demo-wallet';
import type { StudentWithdrawalRecord, AdminWithdrawalRecord } from './demo-student-wallet';
import {
  approveStudentWithdrawal,
  listAllStudentWithdrawals,
  rejectStudentWithdrawal,
} from './demo-student-wallet';

export type FundUserRole = 'family' | 'elder' | 'student';

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
  role: FundUserRole;
  amountCents: number;
  label: string;
  createdAt: string;
  reconciled: boolean;
}

export interface AdminPaymentRecord {
  id: string;
  userId: string;
  userName: string;
  role: FundUserRole;
  amountCents: number;
  label: string;
  orderId?: string;
  createdAt: string;
  reconciled: boolean;
}

export type { AdminWithdrawalRecord };

interface ReconcileStore {
  ids: Record<string, boolean>;
}

const RECONCILE_KEY = 'nuanban_admin_funds_v1';

const USER_META: Record<string, { name: string; role: FundUserRole }> = {
  [DEMO_USERS.family.id]: { name: DEMO_USERS.family.nickname, role: 'family' },
  [DEMO_USERS.elder.id]: { name: DEMO_USERS.elder.nickname, role: 'elder' },
  [DEMO_USERS.student.id]: { name: DEMO_USERS.student.nickname, role: 'student' },
  [DEMO_USERS.studentPending.id]: { name: DEMO_USERS.studentPending.nickname, role: 'student' },
};

const WALLET_USER_IDS = [DEMO_USERS.family.id, DEMO_USERS.elder.id];

function loadReconcileStore(): ReconcileStore {
  try {
    const raw = uni.getStorageSync(RECONCILE_KEY) as ReconcileStore | null;
    if (raw?.ids) return raw;
  } catch {
    /* ignore */
  }
  return { ids: {} };
}

function saveReconcileStore(store: ReconcileStore) {
  uni.setStorageSync(RECONCILE_KEY, store);
}

export function clearAdminFundsStore() {
  try {
    uni.removeStorageSync(RECONCILE_KEY);
  } catch {
    /* ignore */
  }
}

function isReconciled(id: string): boolean {
  return !!loadReconcileStore().ids[id];
}

function userMeta(userId: string) {
  return USER_META[userId] || { name: userId, role: 'family' as FundUserRole };
}

function collectWalletRecords(): { topups: AdminTopupRecord[]; payments: AdminPaymentRecord[] } {
  const topups: AdminTopupRecord[] = [];
  const payments: AdminPaymentRecord[] = [];
  for (const userId of WALLET_USER_IDS) {
    const meta = userMeta(userId);
    const overview = getWalletOverview(userId);
    for (const tx of overview.transactions) {
      if (tx.type === 'topup') {
        topups.push({
          id: tx.id,
          userId,
          userName: meta.name,
          role: meta.role,
          amountCents: tx.amountCents,
          label: tx.label,
          createdAt: tx.createdAt,
          reconciled: isReconciled(tx.id),
        });
      } else if (tx.type === 'pay') {
        payments.push({
          id: tx.id,
          userId,
          userName: meta.name,
          role: meta.role,
          amountCents: tx.amountCents,
          label: tx.label,
          orderId: tx.orderId,
          createdAt: tx.createdAt,
          reconciled: isReconciled(tx.id),
        });
      }
    }
  }
  topups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { topups, payments };
}

export function getAdminFundOverview(): FundOverview {
  let totalBalanceCents = 0;
  for (const userId of WALLET_USER_IDS) {
    totalBalanceCents += getWalletOverview(userId).balanceCents;
  }
  const { topups, payments } = collectWalletRecords();
  const topupTotalCents = topups.reduce((s, t) => s + t.amountCents, 0);
  const paymentTotalCents = payments.reduce((s, p) => s + p.amountCents, 0);
  const withdrawals = listAllStudentWithdrawals();
  const pending = withdrawals.filter((w) => w.status === 'pending');
  const pendingWithdrawalCents = pending.reduce((s, w) => s + w.amountCents, 0);
  const unreconciledCount =
    topups.filter((t) => !t.reconciled).length +
    payments.filter((p) => !p.reconciled).length;
  return {
    totalBalanceCents,
    totalBalanceYuan: (totalBalanceCents / 100).toFixed(2),
    topupTotalCents,
    topupTotalYuan: (topupTotalCents / 100).toFixed(2),
    paymentTotalCents,
    paymentTotalYuan: (paymentTotalCents / 100).toFixed(2),
    pendingWithdrawalCents,
    pendingWithdrawalYuan: (pendingWithdrawalCents / 100).toFixed(2),
    pendingWithdrawalCount: pending.length,
    unreconciledCount,
    updatedAt: new Date().toISOString(),
  };
}

export function listAdminTopups(filter?: { reconciled?: boolean }): AdminTopupRecord[] {
  let list = collectWalletRecords().topups;
  if (filter?.reconciled === true) list = list.filter((t) => t.reconciled);
  if (filter?.reconciled === false) list = list.filter((t) => !t.reconciled);
  return list;
}

export function listAdminPayments(filter?: { reconciled?: boolean }): AdminPaymentRecord[] {
  let list = collectWalletRecords().payments;
  if (filter?.reconciled === true) list = list.filter((p) => p.reconciled);
  if (filter?.reconciled === false) list = list.filter((p) => !p.reconciled);
  return list;
}

export function listAdminWithdrawals(filter?: {
  status?: StudentWithdrawalRecord['status'];
}): AdminWithdrawalRecord[] {
  let list = listAllStudentWithdrawals();
  if (filter?.status) list = list.filter((w) => w.status === filter.status);
  return list;
}

export function markFundReconciled(recordId: string): { ok: boolean } {
  const store = loadReconcileStore();
  store.ids[recordId] = true;
  saveReconcileStore(store);
  return { ok: true };
}

export function approveAdminWithdrawal(withdrawalId: string): AdminWithdrawalRecord | null {
  return approveStudentWithdrawal(withdrawalId);
}

export function rejectAdminWithdrawal(
  withdrawalId: string,
  reason?: string,
): AdminWithdrawalRecord | null {
  return rejectStudentWithdrawal(withdrawalId, reason);
}

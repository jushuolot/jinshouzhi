/** 演示栈 · 学生提现（可提现余额 = 已结算 − 已提现） */

import type { SettlementRecord } from './demo-rich-data';

export type WithdrawalChannel = 'wechat' | 'bank';

export interface StudentWithdrawalRecord {
  id: string;
  amountCents: number;
  channel: WithdrawalChannel;
  channelLabel: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface StudentWithdrawalOverview {
  availableCents: number;
  availableYuan: string;
  frozenCents: number;
  frozenYuan: string;
  boundWechat: string;
  boundBank: string;
  withdrawals: StudentWithdrawalRecord[];
}

interface StudentWalletOwner {
  withdrawals: StudentWithdrawalRecord[];
}

interface StudentWalletStore {
  byUser: Record<string, StudentWalletOwner>;
}

const STORAGE_KEY = 'nuanban_student_wallet_v1';
export const MIN_WITHDRAWAL_CENTS = 1000;

const DEMO_BOUND = {
  wechat: '微信零钱 · 尾号 8826',
  bank: '建设银行 · 尾号 6688',
};

function loadStore(): StudentWalletStore {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY) as StudentWalletStore | null;
    if (raw?.byUser) return raw;
  } catch {
    /* ignore */
  }
  const seed: StudentWalletStore = { byUser: {} };
  saveStore(seed);
  return seed;
}

function saveStore(store: StudentWalletStore) {
  uni.setStorageSync(STORAGE_KEY, store);
}

export function clearStudentWalletStore() {
  try {
    uni.removeStorageSync(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function ensureOwner(store: StudentWalletStore, userId: string): StudentWalletOwner {
  if (!store.byUser[userId]) {
    store.byUser[userId] = { withdrawals: [] };
  }
  return store.byUser[userId];
}

function channelLabel(channel: WithdrawalChannel) {
  return channel === 'wechat' ? DEMO_BOUND.wechat : DEMO_BOUND.bank;
}

function computeBalances(settlements: SettlementRecord[], withdrawals: StudentWithdrawalRecord[]) {
  const paidTotal = settlements
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + s.amountCents, 0);
  const frozenCents = settlements
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.amountCents, 0);
  const withdrawnTotal = withdrawals.reduce((sum, w) => sum + w.amountCents, 0);
  const availableCents = Math.max(0, paidTotal - withdrawnTotal);
  return { availableCents, frozenCents };
}

function overviewDto(
  settlements: SettlementRecord[],
  owner: StudentWalletOwner,
): StudentWithdrawalOverview {
  const { availableCents, frozenCents } = computeBalances(settlements, owner.withdrawals);
  return {
    availableCents,
    availableYuan: (availableCents / 100).toFixed(2),
    frozenCents,
    frozenYuan: (frozenCents / 100).toFixed(2),
    boundWechat: DEMO_BOUND.wechat,
    boundBank: DEMO_BOUND.bank,
    withdrawals: [...owner.withdrawals].slice(0, 20),
  };
}

export function getStudentWithdrawalOverview(
  userId: string,
  settlements: SettlementRecord[],
): StudentWithdrawalOverview {
  const store = loadStore();
  const owner = ensureOwner(store, userId);
  saveStore(store);
  return overviewDto(settlements, owner);
}

export function submitStudentWithdrawal(
  userId: string,
  settlements: SettlementRecord[],
  amountCents: number,
  channel: WithdrawalChannel,
): StudentWithdrawalOverview {
  if (!Number.isFinite(amountCents) || amountCents < MIN_WITHDRAWAL_CENTS) {
    throw new Error('提现金额至少 ¥10.00');
  }
  if (channel !== 'wechat' && channel !== 'bank') {
    throw new Error('请选择提现方式');
  }
  const store = loadStore();
  const owner = ensureOwner(store, userId);
  const { availableCents } = computeBalances(settlements, owner.withdrawals);
  if (amountCents > availableCents) {
    throw new Error('可提现余额不足');
  }
  const now = new Date().toISOString();
  const instant = channel === 'wechat';
  owner.withdrawals.unshift({
    id: `wd-${Date.now()}`,
    amountCents,
    channel,
    channelLabel: channelLabel(channel),
    status: instant ? 'completed' : 'pending',
    createdAt: now,
    completedAt: instant ? now : undefined,
  });
  if (owner.withdrawals.length > 50) owner.withdrawals.length = 50;
  saveStore(store);
  return overviewDto(settlements, owner);
}

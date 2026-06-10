/** 演示栈 · 同学拉新推荐奖励（本地持久化） */

export interface ReferralRecord {
  id: string;
  inviteeName: string;
  status: 'registered' | 'first_order' | 'rewarded';
  rewardCents: number;
  createdAt: string;
  rewardedAt?: string;
}

export interface ReferralOwnerData {
  records: ReferralRecord[];
  totalEarnedCents: number;
  pendingRewardCents: number;
}

interface ReferralStore {
  codes: Record<string, string>;
  byUser: Record<string, ReferralOwnerData>;
  referredUsers: Record<string, { referrerCode: string; registerRewarded: boolean; orderRewarded: boolean }>;
}

const STORAGE_KEY = 'nuanban_referral_v1';
export const REFERRAL_REWARD_REGISTER_CENTS = 500;
export const REFERRAL_REWARD_FIRST_ORDER_CENTS = 1000;

const DEMO_BASE = 'https://jushuolot.github.io/jinshouzhi/nuanban';

function defaultStore(): ReferralStore {
  const studentId = 'user-student';
  const code = codeForUser(studentId);
  return {
    codes: { [code]: studentId },
    byUser: {
      [studentId]: {
        records: [
          {
            id: 'ref-seed-1',
            inviteeName: '王同学',
            status: 'rewarded',
            rewardCents: REFERRAL_REWARD_REGISTER_CENTS + REFERRAL_REWARD_FIRST_ORDER_CENTS,
            createdAt: '2025-05-12T10:00:00.000Z',
            rewardedAt: '2025-05-20T14:00:00.000Z',
          },
          {
            id: 'ref-seed-2',
            inviteeName: '陈同学',
            status: 'first_order',
            rewardCents: REFERRAL_REWARD_REGISTER_CENTS,
            createdAt: '2025-06-01T09:00:00.000Z',
          },
        ],
        totalEarnedCents: 1500,
        pendingRewardCents: 1000,
      },
    },
    referredUsers: {},
  };
}

export function codeForUser(userId: string): string {
  const tail = userId.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase() || '8821';
  return `NB${tail}`;
}

function loadStore(): ReferralStore {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY) as ReferralStore | null;
    if (raw?.codes && raw.byUser) return raw;
  } catch {
    /* ignore */
  }
  const seed = defaultStore();
  saveStore(seed);
  return seed;
}

function saveStore(store: ReferralStore) {
  uni.setStorageSync(STORAGE_KEY, store);
}

function ensureOwner(store: ReferralStore, userId: string) {
  const code = codeForUser(userId);
  store.codes[code] = userId;
  if (!store.byUser[userId]) {
    store.byUser[userId] = { records: [], totalEarnedCents: 0, pendingRewardCents: 0 };
  }
  return { code, owner: store.byUser[userId] };
}

export function buildInviteLink(code: string) {
  return `${DEMO_BASE}/#/pages/common/launch?ref=${encodeURIComponent(code)}`;
}

export function getReferralOverview(userId: string) {
  const store = loadStore();
  const { code, owner } = ensureOwner(store, userId);
  saveStore(store);
  const rewardedCount = owner.records.filter((r) => r.status === 'rewarded').length;
  return {
    code,
    inviteLink: buildInviteLink(code),
    rewardPerInviteCents: REFERRAL_REWARD_REGISTER_CENTS,
    rewardOnFirstOrderCents: REFERRAL_REWARD_FIRST_ORDER_CENTS,
    invitedCount: owner.records.length,
    rewardedCount,
    pendingRewardCents: owner.pendingRewardCents,
    totalEarnedCents: owner.totalEarnedCents,
    records: [...owner.records].reverse(),
  };
}

export function applyReferralOnStudentRegister(
  inviteeUserId: string,
  inviteeName: string,
  referralCode: string,
): boolean {
  const code = referralCode.trim().toUpperCase();
  if (!code) return false;
  const store = loadStore();
  const referrerId = store.codes[code];
  if (!referrerId || referrerId === inviteeUserId) return false;
  if (store.referredUsers[inviteeUserId]) return false;

  const { owner } = ensureOwner(store, referrerId);
  store.referredUsers[inviteeUserId] = {
    referrerCode: code,
    registerRewarded: true,
    orderRewarded: false,
  };
  owner.pendingRewardCents += REFERRAL_REWARD_REGISTER_CENTS;
  owner.records.unshift({
    id: `ref-${Date.now()}`,
    inviteeName: inviteeName || '新同学',
    status: 'registered',
    rewardCents: REFERRAL_REWARD_REGISTER_CENTS,
    createdAt: new Date().toISOString(),
  });
  saveStore(store);
  return true;
}

export function applyReferralOnFirstOrderComplete(studentUserId: string) {
  const store = loadStore();
  const ref = store.referredUsers[studentUserId];
  if (!ref || ref.orderRewarded) return;

  const referrerId = store.codes[ref.referrerCode];
  if (!referrerId) return;

  const owner = store.byUser[referrerId];
  if (!owner) return;

  ref.orderRewarded = true;
  const record = owner.records.find((r) => r.status === 'registered' || r.status === 'first_order');
  const payout = REFERRAL_REWARD_REGISTER_CENTS + REFERRAL_REWARD_FIRST_ORDER_CENTS;
  if (record) {
    record.status = 'rewarded';
    record.rewardCents = payout;
    record.rewardedAt = new Date().toISOString();
    owner.pendingRewardCents = Math.max(0, owner.pendingRewardCents - REFERRAL_REWARD_REGISTER_CENTS);
    owner.totalEarnedCents += payout;
  }
  saveStore(store);
}

export const PENDING_REFERRAL_KEY = 'pending_referral_code';

export function savePendingReferralCode(code: string) {
  uni.setStorageSync(PENDING_REFERRAL_KEY, code.trim().toUpperCase());
}

export function takePendingReferralCode(): string {
  try {
    const code = String(uni.getStorageSync(PENDING_REFERRAL_KEY) || '').trim();
    uni.removeStorageSync(PENDING_REFERRAL_KEY);
    return code;
  } catch {
    return '';
  }
}

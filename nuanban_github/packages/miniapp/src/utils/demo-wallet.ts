/** 演示栈 · 储值卡（家属/老人各一钱包，本地持久化） */

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'pay';
  amountCents: number;
  label: string;
  createdAt: string;
  orderId?: string;
}

export interface WalletOverview {
  balanceCents: number;
  balanceYuan: string;
  transactions: WalletTransaction[];
}

interface WalletOwnerData {
  balanceCents: number;
  transactions: WalletTransaction[];
}

interface WalletStore {
  byUser: Record<string, WalletOwnerData>;
}

const STORAGE_KEY = 'nuanban_wallet_v1';
const MAX_HISTORY = 10;

function loadStore(): WalletStore {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY) as WalletStore | null;
    if (raw?.byUser) return raw;
  } catch {
    /* ignore */
  }
  const seed: WalletStore = { byUser: {} };
  saveStore(seed);
  return seed;
}

function saveStore(store: WalletStore) {
  uni.setStorageSync(STORAGE_KEY, store);
}

function ensureOwner(store: WalletStore, userId: string): WalletOwnerData {
  if (!store.byUser[userId]) {
    store.byUser[userId] = { balanceCents: 0, transactions: [] };
  }
  return store.byUser[userId];
}

function overviewDto(owner: WalletOwnerData): WalletOverview {
  return {
    balanceCents: owner.balanceCents,
    balanceYuan: (owner.balanceCents / 100).toFixed(2),
    transactions: [...owner.transactions].slice(0, MAX_HISTORY),
  };
}

export function getWalletOverview(userId: string): WalletOverview {
  const store = loadStore();
  const owner = ensureOwner(store, userId);
  saveStore(store);
  return overviewDto(owner);
}

export function topupWallet(userId: string, amountCents: number): WalletOverview {
  if (!Number.isFinite(amountCents) || amountCents < 100) {
    throw new Error('充值金额至少 ¥1.00');
  }
  if (amountCents > 500000) {
    throw new Error('单次充值不超过 ¥5000');
  }
  const store = loadStore();
  const owner = ensureOwner(store, userId);
  owner.balanceCents += amountCents;
  owner.transactions.unshift({
    id: `wt-topup-${Date.now()}`,
    type: 'topup',
    amountCents,
    label: '储值卡充值',
    createdAt: new Date().toISOString(),
  });
  if (owner.transactions.length > 50) owner.transactions.length = 50;
  saveStore(store);
  return overviewDto(owner);
}

export function payOrderFromWallet(
  userId: string,
  orderId: string,
  amountCents: number,
  label: string,
): { ok: true; overview: WalletOverview } | { ok: false; message: string } {
  if (!orderId) return { ok: false, message: '订单不存在' };
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { ok: false, message: '订单金额无效' };
  }
  const store = loadStore();
  const owner = ensureOwner(store, userId);
  if (owner.balanceCents < amountCents) {
    return { ok: false, message: '储值余额不足，请先充值' };
  }
  owner.balanceCents -= amountCents;
  owner.transactions.unshift({
    id: `wt-pay-${Date.now()}`,
    type: 'pay',
    amountCents,
    label: label || '服务消费',
    createdAt: new Date().toISOString(),
    orderId,
  });
  if (owner.transactions.length > 50) owner.transactions.length = 50;
  saveStore(store);
  return { ok: true, overview: overviewDto(owner) };
}

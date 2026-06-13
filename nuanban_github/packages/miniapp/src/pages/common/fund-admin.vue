<template>
  <view class="page nb-page">
    <text class="title">资金管理</text>
    <text class="sub">储值 · 支付 · 提现审批 · 对账{{ isDemoMock ? '（演示）' : '' }}</text>

    <view v-if="overview" class="kpi-grid">
      <view class="kpi">
        <text class="kpi-num accent">¥{{ overview.totalBalanceYuan }}</text>
        <text class="kpi-label">储值总余额</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">¥{{ overview.topupTotalYuan }}</text>
        <text class="kpi-label">累计储值</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">¥{{ overview.paymentTotalYuan }}</text>
        <text class="kpi-label">累计支付</text>
      </view>
      <view class="kpi">
        <text class="kpi-num warn">{{ overview.pendingWithdrawalCount }}</text>
        <text class="kpi-label">待审提现</text>
      </view>
    </view>

    <view v-if="overview?.unreconciledCount" class="banner">
      <text>{{ overview.unreconciledCount }} 笔流水待对账</text>
    </view>

    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: tab === t.key }"
        @tap="tab = t.key"
      >
        {{ t.label }}
        <text v-if="t.badge" class="badge">{{ t.badge }}</text>
      </view>
    </view>

    <ListSearchBar
      v-model="searchKeyword"
      :placeholder="
        tab === 'withdrawal' ? '搜索学生、渠道、金额…' : '搜索用户、订单号、备注…'
      "
    />

    <view v-if="loading" class="empty">加载中…</view>

    <!-- 储值记录 -->
    <template v-else-if="tab === 'topup'">
      <view class="filter-row">
        <view
          v-for="f in reconcileFilters"
          :key="f.key"
          class="filter-chip"
          :class="{ active: topupFilter === f.key }"
          @tap="topupFilter = f.key"
        >
          {{ f.label }}
        </view>
      </view>
      <view v-if="!filteredTopups.length" class="empty">暂无储值记录</view>
      <view v-for="r in filteredTopups" :key="r.id" class="record-card">
        <view class="record-head">
          <text class="record-title">+¥{{ (r.amountCents / 100).toFixed(2) }}</text>
          <text class="tag" :class="r.reconciled ? 'tag-ok' : 'tag-pending'">
            {{ r.reconciled ? '已对账' : '待对账' }}
          </text>
        </view>
        <text class="record-meta">{{ r.userName }} · {{ roleLabel(r.role) }}</text>
        <text class="record-meta">{{ r.label }} · {{ formatTime(r.createdAt) }}</text>
        <button
          v-if="!r.reconciled"
          class="btn-action"
          size="mini"
          :loading="reconciling === r.id"
          @tap="doReconcile(r.id)"
        >
          标记对账
        </button>
      </view>
    </template>

    <!-- 支付记录 -->
    <template v-else-if="tab === 'payment'">
      <view class="filter-row">
        <view
          v-for="f in reconcileFilters"
          :key="f.key"
          class="filter-chip"
          :class="{ active: paymentFilter === f.key }"
          @tap="paymentFilter = f.key"
        >
          {{ f.label }}
        </view>
      </view>
      <view v-if="!filteredPayments.length" class="empty">暂无支付记录</view>
      <view v-for="r in filteredPayments" :key="r.id" class="record-card">
        <view class="record-head">
          <text class="record-title pay">-¥{{ (r.amountCents / 100).toFixed(2) }}</text>
          <text class="tag" :class="r.reconciled ? 'tag-ok' : 'tag-pending'">
            {{ r.reconciled ? '已对账' : '待对账' }}
          </text>
        </view>
        <text class="record-meta">{{ r.userName }} · {{ roleLabel(r.role) }}</text>
        <text class="record-meta">{{ r.label }} · {{ formatTime(r.createdAt) }}</text>
        <text v-if="r.orderId" class="record-link" @tap="goOrder(r.orderId)">
          查看订单 {{ r.orderId }}
        </text>
        <button
          v-if="!r.reconciled"
          class="btn-action"
          size="mini"
          :loading="reconciling === r.id"
          @tap="doReconcile(r.id)"
        >
          标记对账
        </button>
      </view>
    </template>

    <!-- 提现申请 -->
    <template v-else-if="tab === 'withdrawal'">
      <view class="filter-row">
        <view
          v-for="f in statusFilters"
          :key="f.key"
          class="filter-chip"
          :class="{ active: withdrawalFilter === f.key }"
          @tap="withdrawalFilter = f.key"
        >
          {{ f.label }}
        </view>
      </view>
      <view v-if="!filteredWithdrawals.length" class="empty">暂无提现记录</view>
      <view v-for="w in filteredWithdrawals" :key="w.id" class="record-card">
        <view class="record-head">
          <text class="record-title">¥{{ (w.amountCents / 100).toFixed(2) }}</text>
          <text class="tag" :class="statusTagClass(w.status)">{{ statusLabel(w.status) }}</text>
        </view>
        <text class="record-meta">{{ w.studentName }} · {{ w.channelLabel }}</text>
        <text class="record-meta">{{ formatTime(w.createdAt) }}</text>
        <text v-if="w.rejectReason" class="record-reject">驳回：{{ w.rejectReason }}</text>
        <view v-if="w.status === 'pending'" class="action-row">
          <button
            class="btn-approve"
            size="mini"
            :loading="acting === w.id + ':approve'"
            @tap="doApprove(w.id)"
          >
            批准打款
          </button>
          <button
            class="btn-reject"
            size="mini"
            :loading="acting === w.id + ':reject'"
            @tap="doReject(w.id)"
          >
            驳回
          </button>
        </view>
      </view>
    </template>

    <text v-if="overview?.updatedAt" class="ts">更新于 {{ formatTime(overview.updatedAt) }}</text>
    <OpsTabBar current="/pages/common/fund-admin" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ListSearchBar from '../../components/ListSearchBar.vue';
import OpsTabBar from '../../components/OpsTabBar.vue';
import { matchListKeyword } from '../../utils/list-search';
import { onShow } from '@dcloudio/uni-app';
import {
  approveFundWithdrawal,
  fetchFundOverview,
  fetchFundPayments,
  fetchFundTopups,
  fetchFundWithdrawals,
  reconcileFundRecord,
  rejectFundWithdrawal,
  type AdminPaymentRecord,
  type AdminTopupRecord,
  type AdminWithdrawalRecord,
  type FundOverview,
} from '../../api/funds';
import { formatShortTime } from '../../utils/format-time';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';
import { isDemoMockEnabled } from '../../utils/demo-mock';

const isDemoMock = isDemoMockEnabled();

type TabKey = 'topup' | 'payment' | 'withdrawal';
type FilterKey = 'all' | 'pending' | 'done';

const tabs = computed(() => [
  { key: 'topup' as TabKey, label: '储值', badge: 0 },
  { key: 'payment' as TabKey, label: '支付', badge: 0 },
  {
    key: 'withdrawal' as TabKey,
    label: '提现',
    badge: overview.value?.pendingWithdrawalCount || 0,
  },
]);

const reconcileFilters = [
  { key: 'all' as FilterKey, label: '全部' },
  { key: 'pending' as FilterKey, label: '待对账' },
  { key: 'done' as FilterKey, label: '已对账' },
];

const statusFilters = [
  { key: 'all' as FilterKey, label: '全部' },
  { key: 'pending' as FilterKey, label: '待审核' },
  { key: 'done' as FilterKey, label: '已完成' },
];

const tab = ref<TabKey>('withdrawal');
const loading = ref(false);
const overview = ref<FundOverview | null>(null);
const topups = ref<AdminTopupRecord[]>([]);
const payments = ref<AdminPaymentRecord[]>([]);
const withdrawals = ref<AdminWithdrawalRecord[]>([]);
const topupFilter = ref<FilterKey>('all');
const paymentFilter = ref<FilterKey>('all');
const withdrawalFilter = ref<FilterKey>('all');
const reconciling = ref('');
const acting = ref('');
const searchKeyword = ref('');

function applyFundSearch<T extends Record<string, unknown>>(rows: T[], fields: (row: T) => unknown[]) {
  const q = searchKeyword.value;
  if (!q.trim()) return rows;
  return rows.filter((row) => matchListKeyword(q, fields(row)));
}

const filteredTopups = computed(() => {
  let rows = topups.value;
  if (topupFilter.value === 'pending') rows = rows.filter((t) => !t.reconciled);
  if (topupFilter.value === 'done') rows = rows.filter((t) => t.reconciled);
  return applyFundSearch(rows, (t) => [t.userName, t.role, t.label, t.id, t.amountCents]);
});

const filteredPayments = computed(() => {
  let rows = payments.value;
  if (paymentFilter.value === 'pending') rows = rows.filter((p) => !p.reconciled);
  if (paymentFilter.value === 'done') rows = rows.filter((p) => p.reconciled);
  return applyFundSearch(rows, (p) => [p.userName, p.role, p.label, p.orderId, p.id, p.amountCents]);
});

const filteredWithdrawals = computed(() => {
  let rows = withdrawals.value;
  if (withdrawalFilter.value === 'pending') {
    rows = rows.filter((w) => w.status === 'pending');
  } else if (withdrawalFilter.value === 'done') {
    rows = rows.filter((w) => w.status === 'completed');
  }
  return applyFundSearch(rows, (w) => [
    w.studentName,
    w.channelLabel,
    w.id,
    w.amountCents,
    w.status,
    w.rejectReason,
  ]);
});

function formatTime(iso: string) {
  return formatShortTime(iso);
}

function roleLabel(role: string) {
  if (role === 'family') return '家属';
  if (role === 'elder') return '老人';
  return '学生';
}

function statusLabel(status: AdminWithdrawalRecord['status']) {
  if (status === 'pending') return '待审核';
  if (status === 'completed') return '已打款';
  return '已驳回';
}

function statusTagClass(status: AdminWithdrawalRecord['status']) {
  if (status === 'pending') return 'tag-pending';
  if (status === 'completed') return 'tag-ok';
  return 'tag-reject';
}

async function reload() {
  loading.value = true;
  try {
    const [o, t, p, w] = await Promise.all([
      fetchFundOverview(),
      fetchFundTopups(),
      fetchFundPayments(),
      fetchFundWithdrawals(),
    ]);
    overview.value = o;
    topups.value = t;
    payments.value = p;
    withdrawals.value = w;
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function doReconcile(recordId: string) {
  reconciling.value = recordId;
  try {
    await reconcileFundRecord(recordId);
    uni.showToast({ title: '已对账', icon: 'success' });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    reconciling.value = '';
  }
}

async function doApprove(id: string) {
  acting.value = `${id}:approve`;
  try {
    await approveFundWithdrawal(id);
    uni.showToast({ title: '已批准打款', icon: 'success' });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    acting.value = '';
  }
}

function doReject(id: string) {
  uni.showModal({
    title: '驳回提现',
    editable: true,
    placeholderText: '驳回原因（可选）',
    success: async (res) => {
      if (!res.confirm) return;
      acting.value = `${id}:reject`;
      try {
        await rejectFundWithdrawal(id, res.content || undefined);
        uni.showToast({ title: '已驳回', icon: 'none' });
        await reload();
      } catch (e) {
        uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
      } finally {
        acting.value = '';
      }
    },
  });
}

function goOrder(orderId: string) {
  uni.navigateTo({ url: `/package-family/order/detail?id=${orderId}` });
}

onShow(() => {
  if (!requireOpsSession()) return;
  void reload();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.sub {
  display: block;
  margin: 8rpx 0 24rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.kpi {
  background: var(--nb-surface);
  border-radius: var(--nb-radius-md);
  padding: 24rpx;
  text-align: center;
  box-shadow: var(--nb-shadow-soft);
}
.kpi-num {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.kpi-num.accent {
  color: var(--nb-primary);
}
.kpi-num.warn {
  color: #c45c26;
}
.kpi-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.banner {
  margin-bottom: 20rpx;
  padding: 16rpx 20rpx;
  background: #fff8e6;
  border: 1rpx solid #f0d080;
  border-radius: var(--nb-radius-sm);
  font-size: 24rpx;
  color: #8a6d3b;
}
.tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 8rpx;
  font-size: 26rpx;
  background: var(--nb-surface);
  border-radius: var(--nb-radius-sm);
  color: var(--nb-text-muted);
  position: relative;
}
.tab.active {
  background: #fff5ef;
  color: var(--nb-primary);
  font-weight: 600;
  border: 1rpx solid #f0dcc8;
}
.badge {
  position: absolute;
  top: 4rpx;
  right: 8rpx;
  min-width: 28rpx;
  height: 28rpx;
  line-height: 28rpx;
  padding: 0 6rpx;
  font-size: 18rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 999rpx;
}
.filter-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;
}
.filter-chip {
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  background: #f5f5f5;
  border-radius: 999rpx;
  color: #666;
}
.filter-chip.active {
  background: #fff5ef;
  color: #c45c26;
  border: 1rpx solid #f0dcc8;
}
.record-card {
  background: var(--nb-surface);
  padding: 24rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 12rpx;
  box-shadow: var(--nb-shadow-soft);
}
.record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.record-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2e7d32;
}
.record-title.pay {
  color: #c45c26;
}
.record-meta {
  display: block;
  font-size: 24rpx;
  color: #888;
  margin-top: 4rpx;
}
.record-link {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-primary);
}
.record-reject {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #b71c1c;
}
.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.tag-ok {
  background: #e8f5e9;
  color: #2e7d32;
}
.tag-pending {
  background: #fff8e6;
  color: #8a6d3b;
}
.tag-reject {
  background: #ffebee;
  color: #b71c1c;
}
.btn-action {
  margin-top: 12rpx;
  background: #f5f5f5;
  color: #666;
}
.action-row {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
.btn-approve {
  flex: 1;
  background: #c45c26;
  color: #fff;
}
.btn-reject {
  flex: 1;
  background: #fff;
  color: #b71c1c;
  border: 1rpx solid #ffcdd2;
}
.empty {
  text-align: center;
  padding: 60rpx;
  color: #999;
  font-size: 26rpx;
}
.ts {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #bbb;
}
</style>

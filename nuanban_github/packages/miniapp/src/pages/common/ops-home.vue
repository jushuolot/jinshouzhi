<template>
  <view class="page nb-page">
    <view class="header">
      <view class="header-main">
        <text class="title">暖伴运营台</text>
        <text v-if="releaseBadge" class="release-badge">{{ releaseBadge }}</text>
      </view>
      <text class="sub">平台撮合 · 学生审核 · 派单与资金</text>
    </view>

    <view class="kpi-grid">
      <view class="kpi">
        <text class="kpi-num accent">{{ overview?.ordersPendingAccept ?? pendingCount }}</text>
        <text class="kpi-label">待接单</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview?.ordersInService ?? '-' }}</text>
        <text class="kpi-label">服务中</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview?.ordersCompleted ?? '-' }}</text>
        <text class="kpi-label">已完成</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview?.eldersTotal ?? '-' }}</text>
        <text class="kpi-label">服务老人</text>
      </view>
    </view>

    <view v-if="overview" class="kpi-grid kpi-secondary">
      <view class="kpi">
        <text class="kpi-num accent">{{ overview.ordersPendingPayment ?? 0 }}</text>
        <text class="kpi-label">待支付</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">¥{{ overview.walletPaidTotalYuan ?? '0.00' }}</text>
        <text class="kpi-label">已付总额</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview.serviceLogCount ?? 0 }}</text>
        <text class="kpi-label">服务归档</text>
      </view>
      <view class="kpi">
        <text class="kpi-num warn">{{ pendingWithdrawals }}</text>
        <text class="kpi-label">待审提现</text>
      </view>
    </view>

    <view v-if="overview" class="meta-row">
      <text>撮合成功率 {{ overview.matchSuccessRatePct }}%</text>
      <text>今日撮合 {{ overview.todayMatches }}</text>
    </view>

    <view v-if="todoItems.length" class="section-title">待办</view>
    <view v-for="item in todoItems" :key="item.key" class="todo-card" @tap="item.go">
      <text class="todo-icon">{{ item.icon }}</text>
      <view class="todo-body">
        <text class="todo-title">{{ item.title }}</text>
        <text class="todo-desc">{{ item.desc }}</text>
      </view>
      <text class="todo-badge">{{ item.count }}</text>
      <text class="chevron">›</text>
    </view>

    <view class="section-title">最新动态</view>
    <view v-if="!activities.length" class="empty-activity nb-card">
      <text class="empty-text">暂无动态 · 接单或支付后将自动记录</text>
    </view>
    <view v-for="a in activities" :key="a.id" class="activity-row nb-card">
      <text class="act-icon">{{ actIcon(a.kind) }}</text>
      <view class="act-body">
        <text class="act-title">{{ a.title }}</text>
        <text class="act-detail">{{ a.detail }}</text>
        <text class="act-time">{{ formatRelativeTime(a.createdAt) }}</text>
      </view>
    </view>

    <text v-if="overview?.updatedAt" class="ts">数据更新 {{ formatTime(overview.updatedAt) }}</text>

    <OpsTabBar current="/pages/common/ops-home" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import OpsTabBar from '../../components/OpsTabBar.vue';
import { fetchPlatformActivity, fetchPlatformOverview, type PlatformOverview } from '../../api/platform';
import { fetchFundOverview } from '../../api/funds';
import { listDispatchableOrders } from '../../api/org';
import { activityIcon } from '../../utils/demo-activity';
import type { ActivityEvent } from '../../utils/demo-activity';
import { formatRelativeTime, formatShortTime } from '../../utils/format-time';
import { releaseLabel } from '../../config/release';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';
import { isDemoMockEnabled } from '../../utils/demo-mock';

const isDemoMock = isDemoMockEnabled();

const releaseBadge = releaseLabel();
const pendingCount = ref(0);
const pendingWithdrawals = ref(0);
const overview = ref<PlatformOverview | null>(null);
const activities = ref<ActivityEvent[]>([]);

const todoItems = computed(() => {
  const items: Array<{
    key: string;
    icon: string;
    title: string;
    desc: string;
    count: number | string;
    go: () => void;
  }> = [];

  const studentsPending = overview.value?.studentsPendingCount ?? 0;
  if (studentsPending > 0) {
    items.push({
      key: 'students',
      icon: '🎓',
      title: '学生资料审核',
      desc: '核验照与学校信息 · 通过后可接单',
      count: studentsPending,
      go: () => uni.redirectTo({ url: '/pages/common/student-profiles?filter=pending' }),
    });
  }

  const sos = overview.value?.sosActiveCount ?? 0;
  if (sos > 0) {
    items.push({
      key: 'sos',
      icon: '🆘',
      title: 'SOS 求助',
      desc: '老人一键求助 · 需跟进确认',
      count: sos,
      go: () => uni.navigateTo({ url: '/pages/common/ops-sos' }),
    });
  }

  const pending = overview.value?.ordersPendingAccept ?? pendingCount.value;
  if (pending > 0) {
    items.push({
      key: 'dispatch',
      icon: '🏢',
      title: '机构派单',
      desc: '将待接单指定给学生',
      count: pending,
      go: () => uni.redirectTo({ url: '/pages/common/org-dispatch' }),
    });
  }

  const confirm = overview.value?.ordersPendingConfirm ?? 0;
  if (confirm > 0) {
    items.push({
      key: 'confirm',
      icon: '✅',
      title: '待确认完成',
      desc: '服务已结束 · 等待家属/老人确认',
      count: confirm,
      go: () => uni.redirectTo({ url: '/pages/common/fund-admin' }),
    });
  }

  const pay = overview.value?.ordersPendingPayment ?? 0;
  if (pay > 0) {
    items.push({
      key: 'pay',
      icon: '💳',
      title: '待支付订单',
      desc: '家属端待完成支付',
      count: pay,
      go: () => uni.redirectTo({ url: '/pages/common/fund-admin' }),
    });
  }

  const wd = pendingWithdrawals.value || overview.value?.pendingWithdrawalCount || 0;
  if (wd > 0) {
    items.push({
      key: 'withdraw',
      icon: '💰',
      title: '提现审批',
      desc: isDemoMock ? '学生提现待审核（演示不打款）' : '学生提现待审核',
      count: wd,
      go: () => uni.redirectTo({ url: '/pages/common/fund-admin' }),
    });
  }
  return items;
});

function actIcon(kind: ActivityEvent['kind']) {
  return activityIcon(kind);
}

function formatTime(iso: string) {
  return formatShortTime(iso);
}

async function reload() {
  try {
    const [list, o, acts, funds] = await Promise.all([
      listDispatchableOrders(),
      fetchPlatformOverview().catch(() => null),
      fetchPlatformActivity().catch(() => []),
      fetchFundOverview().catch(() => null),
    ]);
    pendingCount.value = list.length;
    pendingWithdrawals.value = funds?.pendingWithdrawalCount ?? 0;
    if (o) overview.value = o;
    activities.value = acts.slice(0, 6);
  } catch (e) {
    pendingCount.value = 0;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
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
.header {
  margin-bottom: 24rpx;
}
.header-main {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--nb-text);
}
.release-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #fff3e8;
  color: var(--nb-primary);
  border: 1rpx solid #f0dcc8;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.kpi-secondary {
  margin-bottom: 12rpx;
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
  font-size: 36rpx;
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
.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 28rpx;
  padding: 0 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.todo-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fffaf5;
  border: 1rpx solid #f0dcc8;
  border-radius: var(--nb-radius-md);
  padding: 24rpx;
  margin-bottom: 12rpx;
}
.todo-icon {
  font-size: 32rpx;
}
.todo-body {
  flex: 1;
  min-width: 0;
}
.todo-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}
.todo-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.todo-badge {
  min-width: 40rpx;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: var(--nb-primary);
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  text-align: center;
}
.chevron {
  font-size: 32rpx;
  color: var(--nb-text-placeholder);
}
.empty-activity {
  padding: 32rpx 24rpx;
  margin-bottom: 16rpx;
  text-align: center;
}
.empty-text {
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.activity-row {
  display: flex;
  gap: 12rpx;
  padding: 20rpx;
  margin-bottom: 10rpx;
}
.act-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}
.act-body {
  flex: 1;
  min-width: 0;
}
.act-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
}
.act-detail {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-secondary);
}
.act-time {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: var(--nb-text-placeholder);
}
.ts {
  display: block;
  margin-top: 16rpx;
  text-align: center;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
</style>

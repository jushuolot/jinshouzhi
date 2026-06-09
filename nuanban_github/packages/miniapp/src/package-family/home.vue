<template>
  <view class="page nb-page">
    <view class="hero">
      <text class="title">家属中心</text>
      <text class="sub">代付 · 外出审批 · 绑定老人</text>
    </view>

    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ stats?.boundElderCount ?? 0 }}</text>
        <text class="stat-label">绑定老人</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num accent">{{ stats?.pendingPaymentCount ?? 0 }}</text>
        <text class="stat-label">待支付</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num accent">{{ stats?.outdoorPendingCount ?? 0 }}</text>
        <text class="stat-label">外出待批</text>
      </view>
    </view>

    <view class="section-title">绑定老人</view>
    <view v-for="b in bindings" :key="b.id" class="elder-card">
      <view class="elder-avatar">{{ elderName(b).slice(0, 1) }}</view>
      <view class="elder-info">
        <text class="elder-name">{{ elderName(b) }}</text>
        <text class="elder-rel">{{ relationLabel(b) }}</text>
      </view>
    </view>
    <view v-if="!bindings.length && !loading" class="empty-hint">暂无绑定（演示数据由 seed 提供）</view>
    <view class="bind-link" @tap="goBind">+ 绑定更多老人</view>

    <view class="section-title">待办事项</view>
    <view class="todo-card" @tap="goPay">
      <view class="todo-left">
        <text class="todo-icon">💳</text>
        <view>
          <text class="todo-title">待支付订单</text>
          <text class="todo-desc">{{ stats?.pendingPaymentCount ?? 0 }} 笔待处理</text>
        </view>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="todo-card" @tap="goPackageBuy">
      <view class="todo-left">
        <text class="todo-icon">📦</text>
        <view>
          <text class="todo-title">服务包购买</text>
          <text class="todo-desc">演示占位 · 机构套餐</text>
        </view>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="todo-card highlight" @tap="goOutdoor">
      <view class="todo-left">
        <text class="todo-icon">🚶</text>
        <view>
          <text class="todo-title">外出审批</text>
          <text class="todo-desc">{{ stats?.outdoorPendingCount ?? 0 }} 笔待您确认</text>
        </view>
      </view>
      <text class="chevron">›</text>
    </view>
    <view v-if="(stats?.sosPendingCount ?? 0) > 0" class="todo-card sos" @tap="goSos">
      <view class="todo-left">
        <text class="todo-icon">🆘</text>
        <view>
          <text class="todo-title">SOS 求助</text>
          <text class="todo-desc">{{ stats?.sosPendingCount ?? 0 }} 条待确认</text>
        </view>
      </view>
      <text class="chevron">›</text>
    </view>

    <RoleTabBar role="family" current="/package-family/home" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import {
  acknowledgeSosAlert,
  fetchFamilyStats,
  listActiveSosAlerts,
  listBoundElders,
  listPendingOutdoorApprovals,
  listPendingPaymentOrders,
  type FamilyStats,
} from '../api/family';
import { useRoleStore } from '../store/role';
import { guardPackageRoute } from '../utils/nav-guard';
import { pbErrorMessage } from '../utils/request';
import type { PbRecord } from '../api/pb';

const roleStore = useRoleStore();
const stats = ref<FamilyStats | null>(null);
const bindings = ref<
  (PbRecord & { elder: string; relation_label?: string; expand?: { elder?: { name: string } } })[]
>([]);
const loading = ref(false);
const outdoorList = ref<{ order: string }[]>([]);

function elderName(b: (typeof bindings.value)[0]) {
  return b.expand?.elder?.name || '老人';
}
function relationLabel(b: (typeof bindings.value)[0]) {
  return b.relation_label || '家属';
}

async function reload() {
  if (!roleStore.user?.id) return;
  loading.value = true;
  try {
    const uid = roleStore.user.id;
    const [st, binds, outdoor] = await Promise.all([
      fetchFamilyStats(),
      listBoundElders(uid),
      listPendingOutdoorApprovals(uid).catch(() => []),
    ]);
    stats.value = st;
    bindings.value = binds;
    outdoorList.value = outdoor;
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  guardPackageRoute('/package-family/home');
  reload();
});

async function goPay() {
  if (!roleStore.user?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  try {
    const bindingsRes = await listBoundElders(roleStore.user.id);
    const elderIds = bindingsRes.map((b) => b.elder).filter(Boolean);
    const orders = await listPendingPaymentOrders(elderIds);
    if (!orders.length) {
      uni.showToast({ title: '暂无待支付订单', icon: 'none' });
      return;
    }
    uni.navigateTo({ url: `/package-family/order/pay?id=${orders[0].id}` });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

async function goOutdoor() {
  if (!roleStore.user?.id) return;
  try {
    const list = outdoorList.value.length
      ? outdoorList.value
      : await listPendingOutdoorApprovals(roleStore.user.id);
    if (!list.length) {
      uni.showToast({ title: '暂无外出待审批', icon: 'none' });
      return;
    }
    const orderId = list[0].order;
    uni.navigateTo({ url: `/package-family/outdoor/approve?id=${orderId}` });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

function goBind() {
  uni.navigateTo({ url: '/package-family/bind' });
}

function goPackageBuy() {
  uni.navigateTo({ url: '/package-family/package/buy' });
}

async function goSos() {
  try {
    const list = await listActiveSosAlerts();
    if (!list.length) {
      uni.showToast({ title: '暂无 SOS 求助', icon: 'none' });
      return;
    }
    const alert = list[0];
    uni.showModal({
      title: 'SOS 求助',
      content: `${alert.elderName}：${alert.message}`,
      confirmText: '已知晓',
      success: async (res) => {
        if (res.confirm) {
          await acknowledgeSosAlert(alert.id);
          await reload();
          uni.showToast({ title: '已确认', icon: 'success' });
        }
      },
    });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}
</script>

<style scoped>
.hero {
  background: var(--nb-hero-gradient);
  padding: 36rpx 28rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 24rpx;
  box-shadow: var(--nb-shadow-soft);
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.stats-card {
  display: flex;
  background: var(--nb-surface);
  border-radius: var(--nb-radius-md);
  padding: 32rpx 0;
  margin-bottom: 32rpx;
  box-shadow: var(--nb-shadow-soft);
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: var(--nb-border);
  align-self: center;
}
.stat-num {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.stat-num.accent {
  color: var(--nb-primary);
}
.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  color: var(--nb-text);
}
.elder-card {
  display: flex;
  align-items: center;
  background: var(--nb-surface);
  padding: 24rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 12rpx;
  box-shadow: var(--nb-shadow-soft);
}
.elder-avatar {
  width: 72rpx;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  background: var(--nb-primary-gradient);
  color: #fff;
  border-radius: 50%;
  font-size: 32rpx;
  margin-right: 20rpx;
}
.elder-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.elder-rel {
  display: block;
  margin-top: 4rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.empty-hint {
  font-size: 24rpx;
  color: var(--nb-text-placeholder);
  margin-bottom: 24rpx;
}
.bind-link {
  text-align: center;
  color: var(--nb-primary);
  font-size: 28rpx;
  padding: 16rpx 0 24rpx;
}
.todo-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--nb-surface);
  padding: 28rpx 24rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 16rpx;
  box-shadow: var(--nb-shadow-soft);
}
.todo-card.highlight {
  border: 2rpx solid var(--nb-border-dashed);
  background: var(--nb-peach);
}
.todo-card.sos {
  border: 2rpx solid #f5d0d0;
  background: #fff8f6;
}
.todo-left {
  display: flex;
  align-items: center;
}
.todo-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}
.todo-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.todo-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.chevron {
  font-size: 36rpx;
  color: var(--nb-text-placeholder);
}
</style>

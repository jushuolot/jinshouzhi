<template>
  <view class="page nb-page elder-mode" :class="fontClass">
    <view class="hero">
      <text class="h1">您好，{{ stats?.elderName || '长辈' }}</text>
      <text class="sub">{{ orgName }}</text>
    </view>

    <view class="stats-card">
      <view class="stat-item" @tap="goOrders">
        <text class="stat-num">{{ stats?.orderCount ?? 0 }}</text>
        <text class="stat-label">我的订单</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="goOrders">
        <text class="stat-num accent">{{ stats?.activeCount ?? 0 }}</text>
        <text class="stat-label">进行中</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="goFind">
        <text class="stat-num">{{ stats?.caregiverNearbyCount ?? 0 }}</text>
        <text class="stat-label">附近大学生</text>
      </view>
    </view>

    <view v-if="recentOrders.length" class="section-title">最近服务</view>
    <view v-if="recentOrders.length" class="order-preview">
      <view
        v-for="o in recentOrders"
        :key="o.id"
        class="order-card"
        @tap="goOrderDetail(o.id)"
      >
        <view class="order-head">
          <text class="order-svc">{{ serviceName(o) }}</text>
          <text class="order-status">{{ statusLabel(o.status) }}</text>
        </view>
        <text class="order-meta">{{ formatTime(o.scheduled_at) }} · ¥{{ ((o.amount_cents || 0) / 100).toFixed(0) }}</text>
      </view>
    </view>

    <view class="section-title">快捷服务</view>
    <view class="quick-grid">
      <view class="quick-item primary" @tap="goFind">
        <text class="quick-icon">🤝</text>
        <text class="quick-text">找陪护</text>
        <text class="quick-desc">附近 {{ stats?.caregiverNearbyCount ?? 0 }} 位大学生</text>
      </view>
      <view class="quick-item" @tap="goOrders">
        <text class="quick-icon">📋</text>
        <text class="quick-text">我的服务</text>
      </view>
      <view class="quick-item warn" @tap="sos">
        <text class="quick-icon">🆘</text>
        <text class="quick-text">一键求助</text>
      </view>
    </view>

    <RoleTabBar role="elder" current="/package-elder/home" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import RoleTabBar from '../components/RoleTabBar.vue';
import { onShow } from '@dcloudio/uni-app';
import {
  fetchElderStats,
  listOrdersForElder,
  resolveElderIdForApi,
  triggerSos,
  type ElderStats,
  type OrderRow,
} from '../api/elder';
import { useRoleStore } from '../store/role';
import { elderFontClass } from '../utils/elder-accessibility';
import { guardPackageRoute } from '../utils/nav-guard';
import { orderStatusLabel } from '../utils/order-status';
import { pbErrorMessage } from '../utils/request';

const stats = ref<ElderStats | null>(null);
const recentOrders = ref<
  (OrderRow & { expand?: { service_item?: { name: string } } })[]
>([]);
const fontClass = computed(() => elderFontClass());
const orgName = ref('暖伴示范养老院');
const roleStore = useRoleStore();

function serviceName(o: (typeof recentOrders.value)[0]) {
  return o.expand?.service_item?.name || '陪护服务';
}

function statusLabel(s: string) {
  return orderStatusLabel(s);
}

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onShow(async () => {
  guardPackageRoute('/package-elder/home');
  try {
    stats.value = await fetchElderStats();
    if (stats.value?.elderProfileId) {
      roleStore.setElderProfileId(stats.value.elderProfileId);
    }
    const elderId = await resolveElderIdForApi();
    if (elderId) {
      const all = await listOrdersForElder(elderId);
      recentOrders.value = all.slice(0, 3);
    } else {
      recentOrders.value = [];
    }
  } catch (e) {
    recentOrders.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
});

function goFind() {
  uni.navigateTo({ url: '/package-elder/caregivers/list' });
}
function goOrders() {
  uni.redirectTo({ url: '/package-elder/order/list' });
}
function goOrderDetail(id: string) {
  uni.navigateTo({ url: `/package-elder/order/detail?id=${id}` });
}
async function sos() {
  const elderId = (await resolveElderIdForApi()) || stats.value?.elderProfileId || 'elder-zhang';
  try {
    await triggerSos(elderId);
    uni.showModal({
      title: '求助已发送',
      content: '已通知绑定家属与附近学生，请保持电话畅通。',
      showCancel: false,
    });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}
</script>

<style scoped>
.hero {
  background: var(--nb-hero-gradient);
  padding: 40rpx 32rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 24rpx;
  box-shadow: var(--nb-shadow-soft);
}
.hero .h1 {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
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
  font-size: 36rpx;
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
.order-preview {
  margin-bottom: 28rpx;
}
.order-card {
  background: var(--nb-surface);
  padding: 28rpx 24rpx;
  margin-bottom: 12rpx;
  border-radius: var(--nb-radius-md);
  box-shadow: var(--nb-shadow-soft);
}
.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-svc {
  font-size: 30rpx;
  font-weight: 600;
}
.order-status {
  font-size: 22rpx;
  color: #c45c26;
  background: #fff5ef;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.order-meta {
  display: block;
  margin-top: 10rpx;
  color: #888;
  font-size: 24rpx;
}
.quick-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.quick-item {
  display: flex;
  align-items: center;
  background: var(--nb-surface);
  padding: 32rpx 28rpx;
  border-radius: var(--nb-radius-md);
  box-shadow: var(--nb-shadow-soft);
}
.quick-item.primary {
  background: var(--nb-primary-gradient);
  color: #fff;
  box-shadow: var(--nb-shadow-primary);
}
.quick-item.warn {
  border: 2rpx solid #f5d0d0;
  background: #fff8f6;
}
.quick-icon {
  font-size: 44rpx;
  margin-right: 20rpx;
}
.quick-text {
  font-size: 32rpx;
  font-weight: 600;
}
.quick-desc {
  margin-left: auto;
  font-size: 24rpx;
  opacity: 0.85;
}
.page.elder-large .hero .h1 {
  font-size: 56rpx;
}
.page.elder-large .quick-text {
  font-size: 40rpx;
}
.page.elder-large .order-svc {
  font-size: 38rpx;
}
</style>

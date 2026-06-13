<template>
  <view class="page nb-page elder-mode" :class="fontClass">
    <GuestBrowseBanner v-if="guestMode" />
    <view class="hero">
      <text class="h1">您好，{{ stats?.elderName || '长辈' }}</text>
      <text class="sub">{{ orgName }}</text>
    </view>

    <view class="stats-card nb-stats-card">
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

    <view class="section-title nb-section-title">最近服务</view>
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
    <view v-else class="empty-orders" @tap="goFind">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无服务记录</text>
      <text class="empty-cta">找附近大学生陪护 ›</text>
    </view>

    <view class="section-title nb-section-title">快捷服务</view>
    <view class="wallet-card" @tap="goWallet">
      <view class="wallet-left">
        <text class="wallet-icon">💰</text>
        <view>
          <text class="wallet-title">储值卡</text>
          <text class="wallet-desc">余额 ¥{{ walletBalanceYuan }} · 确认服务时可抵扣</text>
        </view>
      </view>
      <text class="chevron">›</text>
    </view>
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
      <view class="quick-item" @tap="goServiceLogs">
        <text class="quick-icon">📝</text>
        <text class="quick-text">服务记录</text>
        <text class="quick-desc">{{ serviceLogCount }} 条归档</text>
      </view>
      <view class="quick-item warn" @tap="sos">
        <text class="quick-icon">🆘</text>
        <text class="quick-text">一键求助</text>
      </view>
    </view>

    <RoleTabBar role="elder" current="/package-elder/home" />
    <OpsSessionBar />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import OpsSessionBar from '../components/OpsSessionBar.vue';
import RoleTabBar from '../components/RoleTabBar.vue';
import GuestBrowseBanner from '../components/GuestBrowseBanner.vue';
import { onShow } from '@dcloudio/uni-app';
import {
  fetchElderSelfProfile,
  fetchElderStats,
  listElderServiceLogs,
  listOrdersForElder,
  resolveElderIdForApi,
  triggerSos,
  type ElderStats,
  type OrderRow,
} from '../api/elder';
import { fetchElderWallet } from '../api/wallet';
import { useRoleStore } from '../store/role';
import { elderFontClass } from '../utils/elder-accessibility';
import { GUEST_ELDER_PREVIEW } from '../utils/guest-preview-data';
import { isGuestBrowse, requireOperableAuth } from '../utils/guest-browse';
import { guardPackageRoute } from '../utils/nav-guard';
import { orderStatusLabel } from '../utils/order-status';
import { pbErrorMessage } from '../utils/request';

const stats = ref<ElderStats | null>(null);
const recentOrders = ref<
  (OrderRow & { expand?: { service_item?: { name: string } } })[]
>([]);
const fontClass = computed(() => elderFontClass());
const orgName = ref('未指定机构');
const roleStore = useRoleStore();
const walletBalanceYuan = ref('0.00');
const serviceLogCount = ref(0);
const guestMode = ref(false);

function loadGuestPreview() {
  const p = GUEST_ELDER_PREVIEW;
  stats.value = p.stats;
  orgName.value = p.orgName;
  walletBalanceYuan.value = p.walletBalanceYuan;
  serviceLogCount.value = p.serviceLogCount;
  recentOrders.value = p.recentOrders;
}

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
  guestMode.value = isGuestBrowse();
  if (!guardPackageRoute('/package-elder/home')) return;
  if (guestMode.value) {
    loadGuestPreview();
    return;
  }
  try {
    const [st, wallet, logs, profile] = await Promise.all([
      fetchElderStats(),
      fetchElderWallet().catch(() => null),
      listElderServiceLogs().catch(() => []),
      fetchElderSelfProfile().catch(() => null),
    ]);
    stats.value = st;
    if (profile?.orgName) orgName.value = profile.orgName;
    if (wallet) walletBalanceYuan.value = wallet.balanceYuan;
    serviceLogCount.value = logs.length;
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

function goWallet() {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: '/package-elder/wallet/index' });
}

function goFind() {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: '/package-elder/caregivers/list' });
}
function goOrders() {
  if (!requireOperableAuth()) return;
  uni.redirectTo({ url: '/package-elder/order/list' });
}
function goServiceLogs() {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: '/package-elder/service/log' });
}
function goOrderDetail(id: string) {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: `/package-elder/order/detail?id=${id}` });
}
async function sos() {
  if (!requireOperableAuth()) return;
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
  margin-bottom: 32rpx;
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
  margin-bottom: 16rpx;
}
.wallet-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--nb-peach, #fff8f0);
  border: 2rpx solid var(--nb-border-dashed, #e8c4a8);
  padding: 28rpx 24rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 20rpx;
  box-shadow: var(--nb-shadow-soft);
}
.wallet-left {
  display: flex;
  align-items: center;
  flex: 1;
}
.wallet-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}
.wallet-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}
.wallet-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.chevron {
  font-size: 36rpx;
  color: var(--nb-text-placeholder);
}
.order-preview {
  margin-bottom: 28rpx;
}
.empty-orders {
  text-align: center;
  padding: 36rpx 24rpx;
  background: var(--nb-surface);
  border-radius: var(--nb-radius-md);
  margin-bottom: 28rpx;
  box-shadow: var(--nb-shadow-soft);
}
.empty-icon {
  display: block;
  font-size: 44rpx;
  margin-bottom: 8rpx;
}
.empty-text {
  display: block;
  font-size: 28rpx;
  color: var(--nb-text-muted);
}
.empty-cta {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--nb-primary);
  font-weight: 500;
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

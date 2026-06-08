<template>
  <view class="page elder-mode" :class="fontClass">
    <view class="hero">
      <text class="h1">您好，{{ stats?.elderName || '长辈' }}</text>
      <text class="sub">{{ orgName }}</text>
    </view>

    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ stats?.orderCount ?? 0 }}</text>
        <text class="stat-label">我的订单</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num accent">{{ stats?.activeCount ?? 0 }}</text>
        <text class="stat-label">进行中</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">{{ stats?.caregiverNearbyCount ?? 0 }}</text>
        <text class="stat-label">附近女大学生</text>
      </view>
    </view>

    <view class="section-title">快捷服务</view>
    <view class="quick-grid">
      <view class="quick-item primary" @tap="goFind">
        <text class="quick-icon">🤝</text>
        <text class="quick-text">找陪护</text>
        <text class="quick-desc">附近 {{ stats?.caregiverNearbyCount ?? 0 }} 位女大学生</text>
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
import { fetchElderStats, triggerSos, type ElderStats } from '../api/elder';
import { elderFontClass } from '../utils/elder-accessibility';
import { guardPackageRoute } from '../utils/nav-guard';
import { pbErrorMessage } from '../utils/request';

const stats = ref<ElderStats | null>(null);
const fontClass = computed(() => elderFontClass());
const orgName = ref('暖伴示范养老院');

onShow(async () => {
  guardPackageRoute('/package-elder/home');
  try {
    stats.value = await fetchElderStats();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
});

function goFind() {
  uni.navigateTo({ url: '/package-elder/caregivers/list' });
}
function goOrders() {
  uni.redirectTo({ url: '/package-elder/order/list' });
}
async function sos() {
  const elderId = stats.value?.elderProfileId || 'elder-zhang';
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
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.hero {
  background: linear-gradient(135deg, #fff8f0, #fff);
  padding: 40rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}
.hero .h1 {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
  color: #333;
}
.sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #888;
}
.stats-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx 0;
  margin-bottom: 32rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
  align-self: center;
}
.stat-num {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}
.stat-num.accent {
  color: #c45c26;
}
.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  color: #333;
}
.quick-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.quick-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 32rpx 28rpx;
  border-radius: 16rpx;
}
.quick-item.primary {
  background: linear-gradient(135deg, #c45c26, #d4734a);
  color: #fff;
}
.quick-item.warn {
  border: 2rpx solid #ffcdd2;
  background: #fff8f8;
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
</style>

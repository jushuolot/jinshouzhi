<template>
  <view class="page nb-page">
    <view class="hero">
      <view class="hero-top">
        <view>
          <text class="greeting">你好，{{ profileName }}</text>
          <text class="school">{{ schoolName }}</text>
          <text class="mission">邻里陪伴 · 高校勤工 · 平台安心撮合</text>
        </view>
        <view v-if="pendingCount > 0" class="badge" @tap="goPending">
          <text>{{ pendingCount }} 单待接</text>
        </view>
      </view>
    </view>

    <view class="referral-banner" @tap="goReferral">
      <text class="ref-icon">🎁</text>
      <view class="ref-text">
        <text class="ref-title">推荐同学加入 · 最高得 ¥15</text>
        <text class="ref-desc">分享邀请链接，同学注册并完成首单即有奖励</text>
      </view>
      <text class="ref-arrow">›</text>
    </view>

    <view v-if="sosAlerts.length" class="sos-banner" @tap="handleSos">
      <text class="sos-icon">🆘</text>
      <view class="sos-text">
        <text class="sos-title">紧急求助 {{ sosAlerts.length }} 条</text>
        <text class="sos-desc">{{ sosAlerts[0].elderName }} · 点击查看</text>
      </view>
    </view>

    <view class="stats-card">
      <view class="stat-item" @tap="goPending">
        <text class="stat-num accent">{{ pendingCount }}</text>
        <text class="stat-label">待接单</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="goActive">
        <text class="stat-num">{{ activeCount }}</text>
        <text class="stat-label">服务中</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="goIncome">
        <text class="stat-num">¥{{ stats?.incomeYuan ?? '0.00' }}</text>
        <text class="stat-label">本月收入</text>
      </view>
    </view>

    <view class="section-title">快捷入口</view>
    <view class="quick-grid">
      <view class="quick-item" @tap="goPending">
        <text class="quick-icon">📋</text>
        <text class="quick-text">待接单</text>
        <text v-if="pendingCount" class="quick-badge">{{ pendingCount }}</text>
      </view>
      <view class="quick-item" @tap="goActive">
        <text class="quick-icon">🧑‍⚕️</text>
        <text class="quick-text">服务中</text>
        <text v-if="activeCount" class="quick-badge">{{ activeCount }}</text>
      </view>
      <view class="quick-item" @tap="goIncome">
        <text class="quick-icon">💰</text>
        <text class="quick-text">收入明细</text>
      </view>
      <view class="quick-item" @tap="goDiscover">
        <text class="quick-icon">📍</text>
        <text class="quick-text">附近老人</text>
      </view>
      <view class="quick-item" @tap="goProfile">
        <text class="quick-icon">👤</text>
        <text class="quick-text">我的资料</text>
      </view>
    </view>

    <view v-if="previewElders.length" class="section-title">附近老人预览</view>
    <PersonCard
      v-for="e in previewElders"
      :key="e.id"
      :name="e.name"
      :subtitle="e.orgName"
      :tags="e.tags"
      :distance="formatDistance(e.distanceKm)"
      cta-text="查看"
      @tap="openElder(e)"
    />

    <view v-if="errorMsg" class="error" @tap="reload">
      <text>加载失败（点此重试）</text>
      <text class="mono">{{ errorMsg }}</text>
    </view>

    <RoleTabBar role="student" current="/package-student/home" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import PersonCard from '../components/PersonCard.vue';
import {
  acknowledgeSosAlert,
  fetchStudentProfile,
  fetchStudentStats,
  listActiveOrders,
  listActiveSosAlerts,
  listNearbyElders,
  type SosAlert,
  type StudentStats,
} from '../api/student';
import { guardPackageRoute } from '../utils/nav-guard';
import { getLocationWithFallback } from '../utils/location';
import { pbErrorMessage, request } from '../utils/request';

interface ElderPreview {
  id: string;
  name: string;
  orgName: string;
  distanceKm: number;
  tags?: string[];
}

const pendingCount = ref(0);
const activeCount = ref(0);
const sosAlerts = ref<SosAlert[]>([]);
const stats = ref<StudentStats | null>(null);
const profileName = ref('同学');
const schoolName = ref('示范大学');
const previewElders = ref<ElderPreview[]>([]);
const errorMsg = ref('');

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

async function reload() {
  errorMsg.value = '';
  const [profile, st, pendingRes, activeRes, sosRes] = await Promise.all([
    fetchStudentProfile().catch(() => null),
    fetchStudentStats().catch(() => null),
    request<{ list?: unknown[] }>({ url: '/nuanban/student/orders/pending', method: 'GET' }).catch(
      () => ({ list: [] as unknown[] }),
    ),
    listActiveOrders().catch(() => []),
    listActiveSosAlerts().catch(() => []),
  ]);
  if (profile) {
    profileName.value = profile.displayName || profile.nickname;
    schoolName.value = profile.schoolName;
  }
  stats.value = st;
  pendingCount.value = pendingRes.list?.length ?? st?.pendingCount ?? 0;
  activeCount.value = activeRes.length;
  sosAlerts.value = sosRes;

  try {
    const loc = await getLocationWithFallback(2000);
    const rows = await listNearbyElders(loc.lat, loc.lng);
    previewElders.value = rows.slice(0, 2).map((e) => ({
      id: e.id,
      name: e.name,
      orgName: e.expand?.org?.name || '暖伴示范养老院',
      distanceKm: e.distanceKm,
      tags: (e as { tags?: string[] }).tags,
    }));
  } catch {
    previewElders.value = [];
  }
}

onShow(() => {
  guardPackageRoute('/package-student/home');
  reload();
});

function goPending() {
  uni.redirectTo({ url: '/package-student/order/pending' });
}
function goActive() {
  uni.navigateTo({ url: '/package-student/order/active' });
}
function goIncome() {
  uni.navigateTo({ url: '/package-student/income' });
}
function handleSos() {
  const alert = sosAlerts.value[0];
  if (!alert) return;
  uni.showModal({
    title: '紧急求助',
    content: `${alert.elderName}：${alert.message}`,
    confirmText: '已知晓',
    success: async (res) => {
      if (res.confirm) {
        try {
          await acknowledgeSosAlert(alert.id);
          sosAlerts.value = sosAlerts.value.filter((a) => a.id !== alert.id);
          uni.showToast({ title: '已确认', icon: 'success' });
        } catch (e) {
          uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
        }
      }
    },
  });
}
function goDiscover() {
  uni.redirectTo({ url: '/package-student/discover/list' });
}
function goProfile() {
  uni.redirectTo({ url: '/package-student/profile' });
}

function goReferral() {
  uni.navigateTo({ url: '/package-student/referral/index' });
}
function openElder(e: ElderPreview) {
  const q = [
    `id=${e.id}`,
    `name=${encodeURIComponent(e.name)}`,
    `distanceKm=${e.distanceKm.toFixed(1)}`,
    `orgName=${encodeURIComponent(e.orgName)}`,
  ].join('&');
  uni.navigateTo({ url: `/package-student/discover/elder?${q}` });
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
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.greeting {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.school {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.mission {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-primary);
}
.badge {
  padding: 8rpx 20rpx;
  background: var(--nb-primary-gradient);
  color: #fff;
  font-size: 24rpx;
  border-radius: 24rpx;
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
  color: var(--nb-text);
  margin-bottom: 16rpx;
}
.referral-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff8f0, #fff);
  border: 2rpx solid var(--nb-border-dashed, #e8c4a8);
  padding: 24rpx;
  border-radius: var(--nb-radius-md, 16rpx);
  margin-bottom: 20rpx;
}
.ref-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}
.ref-text {
  flex: 1;
}
.ref-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--nb-primary, #c45c26);
}
.ref-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #a89488);
}
.ref-arrow {
  font-size: 36rpx;
  color: var(--nb-primary-light, #e88b4a);
}
.sos-banner {
  display: flex;
  align-items: center;
  background: #ffebee;
  border: 2rpx solid #ef9a9a;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}
.sos-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}
.sos-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #c62828;
}
.sos-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.quick-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 32rpx;
}
.quick-item {
  flex: 1 1 40%;
  background: var(--nb-surface);
  border-radius: var(--nb-radius-md);
  padding: 28rpx 16rpx;
  box-shadow: var(--nb-shadow-soft);
  text-align: center;
  position: relative;
}
.quick-icon {
  display: block;
  font-size: 40rpx;
}
.quick-text {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-secondary);
}
.quick-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 8rpx;
  font-size: 20rpx;
  color: #fff;
  background: var(--nb-primary);
  border-radius: var(--nb-radius-md);
}
.error {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  background: #fff3f3;
  color: #b71c1c;
}
.mono {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  word-break: break-all;
}
</style>

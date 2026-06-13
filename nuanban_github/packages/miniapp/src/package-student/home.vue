<template>
  <view class="page nb-page">
    <GuestBrowseBanner v-if="guestMode" />
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

    <view v-if="withdrawAvailableYuan" class="withdraw-banner" @tap="goWithdraw">
      <text class="wd-icon">💸</text>
      <view class="wd-text">
        <text class="wd-title">可提现 ¥{{ withdrawAvailableYuan }}</text>
        <text class="wd-desc">结算到账 · 微信/银行卡{{ isDemoMock ? '演示' : '' }}提现</text>
      </view>
      <text class="wd-arrow">›</text>
    </view>

    <view class="stats-card nb-stats-card">
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

    <view class="section-title nb-section-title">快捷入口</view>
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
      <view class="quick-item" @tap="goServiceLog">
        <text class="quick-icon">📝</text>
        <text class="quick-text">服务日志</text>
      </view>
      <view v-if="withdrawAvailableYuan" class="quick-item highlight" @tap="goWithdraw">
        <text class="quick-icon">💸</text>
        <text class="quick-text">提现</text>
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

    <view v-if="previewElders.length" class="section-title nb-section-title">附近老人预览</view>
    <PersonCard
      v-for="e in previewElders"
      :key="e.id"
      :name="e.name"
      :subtitle="[e.gender, e.orgName].filter(Boolean).join(' · ')"
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
    <OpsSessionBar />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OpsSessionBar from '../components/OpsSessionBar.vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import GuestBrowseBanner from '../components/GuestBrowseBanner.vue';
import PersonCard from '../components/PersonCard.vue';
import {
  acknowledgeSosAlert,
  fetchStudentProfile,
  fetchStudentStats,
  listActiveOrders,
  listActiveSosAlerts,
  listNearbyElders,
  listPendingOrders,
  fetchStudentWithdrawal,
  type SosAlert,
  type StudentStats,
} from '../api/student';
import { GUEST_STUDENT_PREVIEW } from '../utils/guest-preview-data';
import { isGuestBrowse, requireOperableAuth } from '../utils/guest-browse';
import { guardPackageRoute } from '../utils/nav-guard';
import { getLocationWithFallback } from '../utils/location';
import { pbErrorMessage } from '../utils/request';
import { isDemoMockEnabled } from '../utils/demo-mock';
import { studentGreetingName } from '../utils/student-display-name';
import { useRoleStore } from '../store/role';

const isDemoMock = isDemoMockEnabled();

interface ElderPreview {
  id: string;
  name: string;
  orgName: string;
  gender?: string;
  distanceKm: number;
  tags?: string[];
}

const pendingCount = ref(0);
const activeCount = ref(0);
const sosAlerts = ref<SosAlert[]>([]);
const stats = ref<StudentStats | null>(null);
const profileName = ref('同学');
const schoolName = ref('');
const previewElders = ref<ElderPreview[]>([]);
const errorMsg = ref('');
const withdrawAvailableYuan = ref('');
const guestMode = ref(false);
const roleStore = useRoleStore();

function loadGuestPreview() {
  const p = GUEST_STUDENT_PREVIEW;
  profileName.value = p.profileName;
  schoolName.value = p.schoolName;
  pendingCount.value = p.pendingCount;
  activeCount.value = p.activeCount;
  stats.value = p.stats;
  withdrawAvailableYuan.value = p.withdrawAvailableYuan;
  sosAlerts.value = p.sosAlerts;
  previewElders.value = p.previewElders;
  errorMsg.value = '';
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

async function reload() {
  errorMsg.value = '';
  const [profile, st, pendingList, activeRes, sosRes, withdrawal] = await Promise.all([
    fetchStudentProfile().catch(() => null),
    fetchStudentStats().catch(() => null),
    listPendingOrders().catch(() => []),
    listActiveOrders().catch(() => []),
    listActiveSosAlerts().catch(() => []),
    fetchStudentWithdrawal().catch(() => null),
  ]);
  if (profile) {
    profileName.value = studentGreetingName(profile);
    schoolName.value = profile.schoolName || '';
    if (profile.displayName?.trim()) {
      roleStore.setUserNickname(profile.displayName.trim());
    }
  }
  stats.value = st;
  pendingCount.value = pendingList.length || st?.pendingCount || 0;
  activeCount.value = activeRes.length;
  sosAlerts.value = sosRes;
  withdrawAvailableYuan.value =
    withdrawal && withdrawal.availableCents > 0 ? withdrawal.availableYuan : '';

  try {
    const loc = await getLocationWithFallback(2000);
    const rows = await listNearbyElders(loc.lat, loc.lng);
    previewElders.value = rows.slice(0, 2).map((e) => ({
      id: e.id,
      name: e.name,
      orgName: e.expand?.org?.name || '未指定机构',
      gender: e.gender,
      distanceKm: e.distanceKm,
      tags: (e as { tags?: string[] }).tags,
    }));
  } catch {
    previewElders.value = [];
  }
}

onShow(() => {
  guestMode.value = isGuestBrowse();
  if (!guardPackageRoute('/package-student/home')) return;
  if (guestMode.value) {
    loadGuestPreview();
    return;
  }
  reload();
});

function goPending() {
  if (!requireOperableAuth()) return;
  uni.redirectTo({ url: '/package-student/order/pending' });
}
function goActive() {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: '/package-student/order/active' });
}
function goIncome() {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: '/package-student/income' });
}
function goServiceLog() {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: '/package-student/schedule/log' });
}
function handleSos() {
  if (!requireOperableAuth()) return;
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
  if (!requireOperableAuth()) return;
  uni.redirectTo({ url: '/package-student/discover/list' });
}
function goProfile() {
  if (!requireOperableAuth()) return;
  uni.redirectTo({ url: '/package-student/profile' });
}

function goReferral() {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: '/package-student/referral/index' });
}
function goWithdraw() {
  if (!requireOperableAuth()) return;
  uni.navigateTo({ url: '/package-student/withdrawal/index' });
}
function openElder(e: ElderPreview) {
  if (!requireOperableAuth()) return;
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
.withdraw-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #f0fff4, #fff);
  border: 2rpx solid #a5d6a7;
  padding: 24rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 20rpx;
}
.wd-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}
.wd-text {
  flex: 1;
}
.wd-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #2e7d32;
}
.wd-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.wd-arrow {
  font-size: 36rpx;
  color: #66bb6a;
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
.quick-item.highlight {
  border: 2rpx solid #a5d6a7;
  background: #f1f8f4;
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

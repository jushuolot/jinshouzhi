<template>
  <view class="page">
    <view class="top-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">‹</text>
        <text class="back-text">返回</text>
      </view>
    </view>

    <view class="hero">
      <CartoonAvatarPicker
        class="hero-avatar"
        :avatar-id="profile?.cartoonAvatarId"
        :name="profile?.nickname"
        @change="onCartoonChange"
      />
      <view class="hero-info">
        <text class="name">{{ profile?.nickname || '学生' }}</text>
        <text class="tag">学生志愿者</text>
        <text v-if="profile?.schoolName" class="sub">{{ profile.schoolName }}</text>
        <text v-if="profile?.email" class="sub email">{{ profile.email }}</text>
      </view>
    </view>

    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ stats?.acceptedCount ?? '-' }}</text>
        <text class="stat-label">累计接单</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">{{ stats?.monthCount ?? '-' }}</text>
        <text class="stat-label">本月接单</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num accent">¥{{ stats?.incomeYuan ?? '0.00' }}</text>
        <text class="stat-label">累计收入</text>
      </view>
    </view>
    <text v-if="stats && stats.incomeCents === 0" class="stats-hint">完成订单并确认后计入收入</text>

    <VerificationPhotoSection
      :photo-url="profile?.verificationPhotoUrl"
      :editable="true"
      @change="onVerificationChange"
    />

    <ProfileDetailCard v-if="profileSections.length" :sections="profileSections" />

    <view class="menu-card">
      <view v-if="roleStore.activeRoles.length > 1" class="menu-item" @tap="goRoleSelect">
        <text>切换身份</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goPending">
        <text>待接单</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goActive">
        <text>服务中订单</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item highlight" @tap="goReferral">
        <text>推荐有奖</text>
        <text class="menu-tag">拉新 ¥15</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item highlight" @tap="goWithdraw">
        <text>收入 / 提现</text>
        <text v-if="withdrawAvailable" class="menu-tag">¥{{ withdrawAvailable }}</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goIncome">
        <text>收入明细</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goSchedule">
        <text>我的排班</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goLogs">
        <text>服务日志</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goSecurity">
        <text>安全中心</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goModuleMap">
        <text>模块地图</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goEditProfile">
        <text>编辑资料</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goDiscover">
        <text>附近老人</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goHome">
        <text>学生首页</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <button class="btn-outline" @tap="goLogin">切换账号 / 重新登录</button>
    <button class="btn-danger" @tap="logout">退出登录</button>

    <RoleTabBar role="student" current="/package-student/profile" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import CartoonAvatarPicker from '../components/CartoonAvatarPicker.vue';
import VerificationPhotoSection from '../components/VerificationPhotoSection.vue';
import ProfileDetailCard, { type ProfileDetailSection } from '../components/ProfileDetailCard.vue';
import { resolveCartoonAvatarUrl } from '../utils/cartoon-avatars';
import {
  fetchStudentProfile,
  fetchStudentStats,
  fetchStudentWithdrawal,
  listPendingOrders,
  updateStudentCartoonAvatar,
  type StudentProfile,
  type StudentStats,
} from '../api/student';
import { useRoleStore } from '../store/role';
import { guardPackageRoute } from '../utils/nav-guard';
import { pbErrorMessage } from '../utils/request';

const roleStore = useRoleStore();
const profile = ref<StudentProfile | null>(null);
const stats = ref<StudentStats | null>(null);
const withdrawAvailable = ref('');

function onVerificationChange(url: string) {
  if (profile.value) profile.value = { ...profile.value, verificationPhotoUrl: url };
}

async function onCartoonChange(id: string) {
  if (profile.value) {
    profile.value = { ...profile.value, cartoonAvatarId: id };
    roleStore.setUserAvatar(resolveCartoonAvatarUrl(id));
  }
  try {
    await updateStudentCartoonAvatar(id);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.redirectTo({ url: '/package-student/home' });
}

const profileSections = computed((): ProfileDetailSection[] => {
  const p = profile.value;
  if (!p?.major) return [];
  return [
    {
      title: '学业信息',
      rows: [
        { label: '专业', value: p.major || '-' },
        { label: '年级', value: p.grade || '-' },
        { label: '年龄', value: p.age ? `${p.age} 岁` : '-' },
        { label: '联系电话', value: p.phone || '-' },
      ],
    },
    {
      title: '服务能力',
      tags: p.serviceTypes,
      rows: [
        { label: '服务区域', value: (p.serviceAreas || []).join('、') || '-' },
        { label: '语言能力', value: (p.languages || []).join('、') || '-' },
        { label: '资质证书', value: (p.certifications || []).join('、') || '-' },
        { label: '服务评分', value: p.rating ? `★ ${p.rating}` : '-' },
        { label: '累计服务', value: p.orderCount ? `${p.orderCount} 次` : '-' },
      ],
      note: p.bio,
    },
    {
      title: '可服务时间',
      rows: (p.availableHours || []).map((h, i) => ({
        label: i === 0 ? '时段' : '',
        value: h,
      })),
      tags: p.personalityTags,
    },
  ];
});

onShow(async () => {
  if (!guardPackageRoute('/package-student/profile')) return;
  const errors: string[] = [];
  const p = await fetchStudentProfile().catch((e) => {
    errors.push(pbErrorMessage(e));
    return null;
  });
  const s = await fetchStudentStats().catch((e) => {
    errors.push(pbErrorMessage(e));
    return null;
  });
  const wd = await fetchStudentWithdrawal().catch((e) => {
    errors.push(pbErrorMessage(e));
    return null;
  });
  if (p) {
    profile.value = p;
    const cartoonUrl = resolveCartoonAvatarUrl(p.cartoonAvatarId);
    roleStore.setUserAvatar(cartoonUrl);
  }
  if (s) stats.value = s;
  if (wd) withdrawAvailable.value = wd.availableYuan;
  if (errors.length) {
    uni.showToast({ title: errors[0], icon: 'none' });
  }
});

async function goPending() {
  try {
    const list = await listPendingOrders();
    if (!list.length) {
      uni.showToast({ title: '暂无待接单', icon: 'none' });
      return;
    }
    if (list.length === 1) {
      uni.navigateTo({ url: `/package-student/order/request?id=${list[0].id}` });
      return;
    }
    uni.navigateTo({ url: '/package-student/order/pending' });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

function goActive() {
  uni.navigateTo({ url: '/package-student/order/active' });
}

function goReferral() {
  uni.navigateTo({ url: '/package-student/referral/index' });
}

function goWithdraw() {
  uni.navigateTo({ url: '/package-student/withdrawal/index' });
}

function goIncome() {
  uni.navigateTo({ url: '/package-student/income' });
}

function goSchedule() {
  uni.navigateTo({ url: '/package-student/schedule/list' });
}

function goLogs() {
  uni.navigateTo({ url: '/package-student/schedule/log' });
}

function goSecurity() {
  uni.navigateTo({ url: '/pages/common/security' });
}

function goModuleMap() {
  uni.navigateTo({ url: '/pages/common/module-map' });
}

function goEditProfile() {
  uni.navigateTo({ url: '/package-student/profile/edit' });
}

function goDiscover() {
  uni.redirectTo({ url: '/package-student/discover/list' });
}

function goHome() {
  uni.redirectTo({ url: '/package-student/home' });
}

function goRoleSelect() {
  uni.navigateTo({ url: '/pages/common/role-select' });
}

function goLogin() {
  uni.reLaunch({ url: '/pages/common/login' });
}

function logout() {
  roleStore.logout();
  uni.reLaunch({ url: '/pages/common/login' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.top-bar {
  margin: -8rpx 0 8rpx;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 0;
  color: var(--nb-primary, #c45c26);
}
.back-icon {
  font-size: 44rpx;
  line-height: 1;
  margin-right: 4rpx;
}
.back-text {
  font-size: 28rpx;
}
.hero {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff8f0, #fff);
  padding: 40rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}
.hero-avatar {
  margin-right: 24rpx;
}
.hero-info {
  flex: 1;
}
.name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.tag {
  display: inline-block;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
  color: #c45c26;
  background: #fff5ef;
  border-radius: 8rpx;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #888;
}
.email {
  font-size: 22rpx;
  color: #aaa;
}
.stats-card {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 32rpx 0;
  margin-bottom: 8rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-divider {
  width: 1rpx;
  background: #eee;
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
.stats-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #bbb;
  margin-bottom: 24rpx;
}
.menu-card {
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 32rpx;
  overflow: hidden;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 30rpx;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item.highlight {
  background: var(--nb-primary-soft, #fff5ef);
}
.menu-tag {
  margin-left: auto;
  margin-right: 12rpx;
  font-size: 22rpx;
  color: var(--nb-primary, #c45c26);
  background: #fff;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--nb-border-dashed, #e8c4a8);
}
.arrow {
  color: #ccc;
  font-size: 36rpx;
}
.btn-outline {
  background: #fff;
  color: #c45c26;
  border: 2rpx solid #c45c26;
  margin-bottom: 24rpx;
}
.btn-danger {
  background: #eee;
  color: #333;
}
</style>

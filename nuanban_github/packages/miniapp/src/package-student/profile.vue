<template>
  <view class="page">
    <view class="hero">
      <view class="avatar">{{ avatarChar }}</view>
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

    <view class="menu-card">
      <view class="menu-item" @tap="goPending">
        <text>待接单</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goActive">
        <text>服务中订单</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goIncome">
        <text>收入明细</text>
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
import {
  fetchStudentProfile,
  fetchStudentStats,
  listPendingOrders,
  type StudentProfile,
  type StudentStats,
} from '../api/student';
import { useRoleStore } from '../store/role';
import { pbErrorMessage } from '../utils/request';

const roleStore = useRoleStore();
const profile = ref<StudentProfile | null>(null);
const stats = ref<StudentStats | null>(null);

const avatarChar = computed(() => {
  const n = profile.value?.nickname || roleStore.user?.nickname || '学';
  return n.slice(0, 1);
});

onShow(async () => {
  try {
    const [p, s] = await Promise.all([fetchStudentProfile(), fetchStudentStats()]);
    profile.value = p;
    stats.value = s;
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
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

function goIncome() {
  uni.navigateTo({ url: '/package-student/income' });
}

function goDiscover() {
  uni.redirectTo({ url: '/package-student/discover/list' });
}

function goHome() {
  uni.redirectTo({ url: '/package-student/home' });
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
.hero {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff8f0, #fff);
  padding: 40rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}
.avatar {
  width: 100rpx;
  height: 100rpx;
  line-height: 100rpx;
  text-align: center;
  background: #c45c26;
  color: #fff;
  font-size: 40rpx;
  font-weight: 600;
  border-radius: 50%;
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

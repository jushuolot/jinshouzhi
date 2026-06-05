<template>
  <view class="page">
    <view class="hero">
      <view class="avatar">{{ avatarChar }}</view>
      <view class="hero-info">
        <text class="name">{{ displayName }}</text>
        <text class="tag">{{ roleLabel }}</text>
        <text v-if="subLine" class="sub">{{ subLine }}</text>
      </view>
    </view>

    <view class="stats-card">
      <view v-for="(item, idx) in statItems" :key="item.label" class="stat-wrap">
        <view v-if="idx > 0" class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num" :class="{ accent: item.accent }">{{ item.value }}</text>
          <text class="stat-label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <view class="menu-card">
      <view v-for="item in menuItems" :key="item.label" class="menu-item" @tap="item.action">
        <text>{{ item.label }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <button class="btn-outline" @tap="goLogin">切换账号 / 重新登录</button>
    <button class="btn-danger" @tap="logout">退出登录</button>
    <RoleTabBar v-if="role" :role="role" :current="currentTab" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from './RoleTabBar.vue';
import { fetchFamilyStats } from '../api/family';
import { fetchElderStats } from '../api/elder';
import { listBoundElders, listPendingPaymentOrders } from '../api/family';
import { useRoleStore } from '../store/role';
import { pbErrorMessage } from '../utils/request';
import type { RoleKey } from '../config/tabs';

const props = defineProps<{ role: RoleKey; currentTab: string }>();
const roleStore = useRoleStore();

const familyStats = ref<{ boundElderCount: number; pendingPaymentCount: number; paidTotalYuan: string } | null>(null);
const elderStats = ref<{ elderName: string; orderCount: number; activeCount: number } | null>(null);

const roleLabel = computed(() => {
  const map: Record<RoleKey, string> = { student: '家属', family: '家属', elder: '老人' };
  if (props.role === 'student') return '学生';
  return map[props.role];
});

const displayName = computed(() => {
  if (props.role === 'elder' && elderStats.value?.elderName) return elderStats.value.elderName;
  return roleStore.user?.nickname || '演示用户';
});

const avatarChar = computed(() => displayName.value.slice(0, 1));

const subLine = computed(() => {
  if (props.role === 'family') return `绑定老人 ${familyStats.value?.boundElderCount ?? 0} 位`;
  if (props.role === 'elder') return '暖伴示范养老院';
  return '';
});

const statItems = computed(() => {
  if (props.role === 'family') {
    return [
      { label: '绑定老人', value: String(familyStats.value?.boundElderCount ?? 0), accent: false },
      { label: '待支付', value: String(familyStats.value?.pendingPaymentCount ?? 0), accent: true },
      { label: '累计代付', value: `¥${familyStats.value?.paidTotalYuan ?? '0.00'}`, accent: false },
    ];
  }
  if (props.role === 'elder') {
    return [
      { label: '我的订单', value: String(elderStats.value?.orderCount ?? 0), accent: false },
      { label: '进行中', value: String(elderStats.value?.activeCount ?? 0), accent: true },
      { label: '档案', value: elderStats.value?.elderName ? '已绑定' : '未绑定', accent: false },
    ];
  }
  return [];
});

const menuItems = computed(() => {
  if (props.role === 'family') {
    return [
      { label: '待支付订单', action: goFamilyPay },
      { label: '订单列表', action: () => uni.redirectTo({ url: '/package-family/order/list' }) },
      { label: '绑定老人', action: () => uni.navigateTo({ url: '/package-family/bind' }) },
      { label: '家属首页', action: () => uni.redirectTo({ url: '/package-family/home' }) },
    ];
  }
  if (props.role === 'elder') {
    return [
      { label: '找陪护', action: () => uni.navigateTo({ url: '/package-elder/caregivers/list' }) },
      { label: '我的服务', action: () => uni.redirectTo({ url: '/package-elder/order/list' }) },
      { label: '无障碍设置', action: () => uni.navigateTo({ url: '/package-elder/settings' }) },
      { label: '老人首页', action: () => uni.redirectTo({ url: '/package-elder/home' }) },
    ];
  }
  return [];
});

onShow(async () => {
  try {
    if (props.role === 'family') familyStats.value = await fetchFamilyStats();
    if (props.role === 'elder') elderStats.value = await fetchElderStats();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
});

async function goFamilyPay() {
  if (!roleStore.user?.id) return;
  try {
    const bindings = await listBoundElders(roleStore.user.id);
    const elderIds = bindings.map((b) => b.elder).filter(Boolean);
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
.stats-card {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 32rpx 0;
  margin-bottom: 24rpx;
}
.stat-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
}
.stat-num {
  display: block;
  font-size: 32rpx;
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
.menu-card {
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 32rpx;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.arrow {
  color: #ccc;
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

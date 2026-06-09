<template>
  <view class="page nb-page-onboard">
    <AuthBrandHeader compact subtitle="学生资质审核中" />
    <view class="card nb-card">
      <text class="icon">⏳</text>
      <text class="title">资质审核中</text>
      <text class="desc">
        通过后即可接单、查看收入与附近老人。预计 1–3 个工作日（演示可用 13800000001 体验已通过账号）。
      </text>
      <text class="email">{{ userEmail }}</text>
    </view>
    <button class="btn nb-btn-primary" @tap="logout">退出登录</button>
    <button class="btn-secondary nb-btn-soft" @tap="goLogin">切换账号</button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AuthBrandHeader from '../../components/AuthBrandHeader.vue';
import { useRoleStore } from '../../store/role';

const roleStore = useRoleStore();
const userEmail = computed(() => roleStore.user?.email || roleStore.user?.nickname || '');

function logout() {
  roleStore.logout();
  uni.reLaunch({ url: '/pages/common/login' });
}

function goLogin() {
  roleStore.logout();
  uni.reLaunch({ url: '/pages/common/login' });
}
</script>

<style scoped>
.card {
  text-align: center;
  padding: 48rpx 32rpx;
}
.icon {
  display: block;
  font-size: 72rpx;
}
.title {
  display: block;
  margin-top: 24rpx;
  font-size: 40rpx;
  font-weight: 600;
  color: var(--nb-primary);
}
.desc {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  color: var(--nb-text-secondary);
  line-height: 1.6;
  text-align: left;
}
.email {
  display: block;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.btn {
  margin-top: 48rpx;
}
.btn-secondary {
  margin-top: 16rpx;
}
</style>

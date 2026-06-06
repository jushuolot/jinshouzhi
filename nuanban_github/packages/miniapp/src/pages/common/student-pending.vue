<template>
  <view class="page">
    <view class="card">
      <text class="icon">⏳</text>
      <text class="title">资质审核中</text>
      <text class="desc">
        您的学生身份正在审核，通过后即可接单、查看收入与附近老人。预计 1–3 个工作日完成（演示）。
      </text>
      <text class="email">{{ userEmail }}</text>
    </view>
    <button class="btn" @tap="logout">退出登录</button>
    <button class="btn-secondary" @tap="goLogin">切换账号</button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoleStore } from '../../store/role';

const roleStore = useRoleStore();
const userEmail = computed(() => roleStore.user?.email || '');

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
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 48rpx 32rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx 32rpx;
  text-align: center;
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
  color: #c45c26;
}
.desc {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  text-align: left;
}
.email {
  display: block;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #999;
}
.btn {
  margin-top: 48rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
.btn-secondary {
  margin-top: 16rpx;
  background: #fff;
  color: #c45c26;
  border: 1px solid #c45c26;
  border-radius: 12rpx;
}
</style>

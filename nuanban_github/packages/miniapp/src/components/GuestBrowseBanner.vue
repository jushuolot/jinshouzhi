<template>
  <view class="banner">
    <view class="banner-text">
      <text class="title">预览模式</text>
      <text class="desc">可浏览界面，操作需登录并完善资料</text>
    </view>
    <button class="btn-login" size="mini" @tap="goLogin">登录/注册</button>
    <view class="roles">
      <text
        v-for="r in roles"
        :key="r.key"
        class="role-chip"
        :class="{ on: r.key === currentRole }"
        @tap="switchRole(r.key)"
      >{{ r.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ROLE_HOME, type RoleKey } from '../config/tabs';
import { enterGuestBrowse, guestBrowseRole } from '../utils/guest-browse';

const roles: { key: RoleKey; label: string }[] = [
  { key: 'elder', label: '老人' },
  { key: 'family', label: '家属' },
  { key: 'student', label: '学生' },
];

const currentRole = computed(() => guestBrowseRole() || 'elder');

function switchRole(role: RoleKey) {
  enterGuestBrowse(role);
  uni.reLaunch({ url: ROLE_HOME[role] });
}

function goLogin() {
  uni.navigateTo({ url: '/pages/common/user-manual?next=login' });
}
</script>

<style scoped>
.banner {
  background: linear-gradient(135deg, #fff5ef, #fff);
  border: 2rpx solid var(--nb-border-dashed, #e8c4a8);
  border-radius: var(--nb-radius-md, 16rpx);
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}
.banner-text {
  margin-bottom: 12rpx;
}
.title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--nb-primary, #c45c26);
}
.desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #999);
}
.btn-login {
  margin: 0 0 12rpx 0;
  background: var(--nb-primary-gradient, linear-gradient(135deg, #c45c26, #e88b4a));
  color: #fff;
  border: none;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 24rpx;
}
.btn-login::after {
  border: none;
}
.roles {
  display: flex;
  gap: 12rpx;
}
.role-chip {
  flex: 1;
  text-align: center;
  padding: 10rpx 0;
  font-size: 24rpx;
  color: var(--nb-text-secondary, #666);
  background: var(--nb-surface, #fff);
  border: 2rpx solid var(--nb-border, #eee);
  border-radius: var(--nb-radius-sm, 12rpx);
}
.role-chip.on {
  color: var(--nb-primary, #c45c26);
  border-color: var(--nb-primary, #c45c26);
  background: #fff8f0;
  font-weight: 600;
}
</style>

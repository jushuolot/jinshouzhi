<template>
  <view
    class="strip"
    :class="{ secure: status.isSecureContext }"
    role="button"
    aria-label="查看安全中心"
    @tap="goSecurity"
  >
    <text class="icon">{{ status.isSecureContext ? '🔒' : '🛡️' }}</text>
    <view class="text">
      <text class="line1">{{ status.connectionLabel }}</text>
      <text class="line2">角色鉴权 · 点击查看安全中心</text>
    </view>
    <text class="chev">›</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getSecurityStatus } from '../utils/security';

const status = computed(() => getSecurityStatus());

function goSecurity() {
  uni.navigateTo({ url: '/pages/common/security' });
}
</script>

<style scoped>
.strip {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 20rpx 0 8rpx;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid var(--nb-border, #f0e6dc);
  border-radius: var(--nb-radius-md, 16rpx);
  backdrop-filter: blur(12px);
}
.strip.secure {
  border-color: #a5d6a7;
  background: rgba(232, 245, 233, 0.85);
}
.icon {
  font-size: 36rpx;
}
.text {
  flex: 1;
  min-width: 0;
}
.line1 {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--nb-text, #3d2a1f);
}
.line2 {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #a89488);
}
.chev {
  font-size: 32rpx;
  color: var(--nb-text-muted, #a89488);
}
</style>

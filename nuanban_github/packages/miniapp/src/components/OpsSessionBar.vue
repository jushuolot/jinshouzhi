<template>
  <view
    v-if="visible"
    class="ops-fab"
    @tap="goHub"
  >
    <text class="ops-fab-icon">📊</text>
    <text class="ops-fab-text">运营台</text>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { isOnOpsShellPage, isOpsSessionActive, openOpsMode, OPS_HOME_PATH } from '../utils/ops-mode';

const visible = ref(false);

function refresh() {
  visible.value = isOpsSessionActive() && !isOnOpsShellPage();
}

function goHub() {
  if (isOpsSessionActive()) {
    uni.navigateTo({
      url: OPS_HOME_PATH,
      fail: () => {
        uni.reLaunch({ url: OPS_HOME_PATH });
      },
    });
    return;
  }
  openOpsMode();
}

onShow(refresh);
refresh();
</script>

<style scoped>
.ops-fab {
  position: fixed;
  right: 24rpx;
  bottom: calc(140rpx + env(safe-area-inset-bottom));
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background: linear-gradient(135deg, #2a2330, #1f1a24);
  border: 2rpx solid rgba(232, 139, 74, 0.45);
  border-radius: 999rpx;
  box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.22);
}
.ops-fab:active {
  opacity: 0.9;
  transform: scale(0.98);
}
.ops-fab-icon {
  font-size: 28rpx;
  line-height: 1;
}
.ops-fab-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #f0ebe6;
}
</style>

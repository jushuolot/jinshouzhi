<template>
  <view class="tabbar">
    <view
      v-for="tab in tabs"
      :key="tab.pagePath"
      class="item"
      :class="{ active: current === tab.pagePath }"
      @tap="go(tab.pagePath)"
    >
      <text class="tab-icon">{{ tab.icon }}</text>
      <text class="tab-text">{{ tab.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ROLE_TABS, type RoleKey } from '../config/tabs';
import { isGuestBrowse, requireOperableAuth } from '../utils/guest-browse';

const props = defineProps<{ role: RoleKey; current: string }>();
const tabs = computed(() => ROLE_TABS[props.role]);

function go(url: string) {
  if (url === props.current) return;
  if (isGuestBrowse() && !url.endsWith('/home')) {
    requireOperableAuth();
    return;
  }
  uni.redirectTo({ url });
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: rgba(255, 252, 248, 0.96);
  border-top: 1rpx solid var(--nb-border);
  padding-bottom: env(safe-area-inset-bottom);
  backdrop-filter: blur(12px);
  box-shadow: 0 -4rpx 24rpx rgba(61, 42, 31, 0.06);
}
.item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12rpx 0 16rpx;
  color: var(--nb-text-secondary);
}
.tab-icon {
  font-size: 36rpx;
  line-height: 1.1;
  opacity: 0.85;
}
.tab-text {
  margin-top: 4rpx;
  font-size: 22rpx;
}
.item.active {
  color: var(--nb-primary);
}
.item.active .tab-icon {
  opacity: 1;
}
.item.active .tab-text {
  font-weight: 600;
}
</style>

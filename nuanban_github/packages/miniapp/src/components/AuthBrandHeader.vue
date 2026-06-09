<template>
  <view class="brand-header" :class="{ dark, compact }">
    <view v-if="showLogo" class="logo-wrap">
      <text class="logo-char">暖</text>
    </view>
    <text class="title">{{ title || APP_TITLE }}</text>
    <text v-if="subtitle" class="sub">{{ subtitle }}</text>
    <text v-else-if="!compact" class="sub">{{ APP_TAGLINE }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { APP_TAGLINE, APP_TITLE } from '../config/brand';

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    dark?: boolean;
    compact?: boolean;
    logo?: boolean;
  }>(),
  { dark: false, compact: false, logo: true },
);

const showLogo = computed(() => props.logo && !props.compact);
</script>

<style scoped>
.brand-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40rpx;
  padding-top: 16rpx;
}
.brand-header.compact {
  margin-bottom: 28rpx;
  padding-top: 0;
}
.logo-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  background: var(--nb-primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--nb-shadow-primary);
  margin-bottom: 24rpx;
}
.brand-header.dark .logo-wrap {
  box-shadow: 0 12rpx 32rpx rgba(232, 139, 74, 0.25);
}
.logo-char {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
}
.title {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--nb-text);
  letter-spacing: 2rpx;
}
.brand-header.dark .title {
  color: var(--nb-dark-text);
}
.sub {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
  line-height: 1.55;
  max-width: 560rpx;
}
.brand-header.dark .sub {
  color: var(--nb-dark-text-muted);
}
</style>

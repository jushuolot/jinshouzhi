<template>
  <view class="person-card" @tap="onTap">
    <view class="avatar" :style="{ background: avatarBg }">
      <text class="avatar-char">{{ avatarChar }}</text>
    </view>
    <view class="body">
      <view class="row-top">
        <text class="name">{{ name }}</text>
        <text v-if="rating != null" class="rating">★ {{ rating }}</text>
      </view>
      <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
      <view v-if="tags?.length" class="tags">
        <text v-for="tag in tags" :key="tag" class="tag">{{ tag }}</text>
      </view>
      <view class="row-bottom">
        <text v-if="distance" class="distance">{{ distance }}</text>
        <text v-if="extra" class="extra">{{ extra }}</text>
      </view>
    </view>
    <view v-if="ctaText" class="cta-wrap">
      <text class="cta">{{ ctaText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name: string;
    subtitle?: string;
    avatarChar?: string;
    avatarBg?: string;
    tags?: string[];
    rating?: number | string;
    distance?: string;
    extra?: string;
    ctaText?: string;
  }>(),
  {
    avatarBg: 'var(--nb-primary)',
  }
);

const emit = defineEmits<{ tap: [] }>();

const avatarChar = computed(() => props.avatarChar || props.name.slice(0, 1));

function onTap() {
  emit('tap');
}
</script>

<style scoped>
.person-card {
  display: flex;
  align-items: flex-start;
  background: var(--nb-surface);
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  border-radius: var(--nb-radius-md);
  box-shadow: var(--nb-shadow-soft);
  border: 2rpx solid var(--nb-border);
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 20rpx;
}
.avatar-char {
  color: #fff;
  font-size: 36rpx;
  font-weight: 600;
}
.body {
  flex: 1;
  min-width: 0;
}
.row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.rating {
  font-size: 24rpx;
  color: var(--nb-primary-light);
  font-weight: 600;
}
.subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}
.tag {
  padding: 4rpx 14rpx;
  font-size: 20rpx;
  color: var(--nb-primary);
  background: var(--nb-primary-soft);
  border-radius: 20rpx;
}
.row-bottom {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 10rpx;
}
.distance {
  font-size: 22rpx;
  color: var(--nb-text-secondary);
}
.extra {
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.cta-wrap {
  flex-shrink: 0;
  margin-left: 12rpx;
  align-self: center;
}
.cta {
  display: inline-block;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  color: #fff;
  background: var(--nb-primary-gradient);
  border-radius: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(196, 92, 38, 0.2);
}
</style>

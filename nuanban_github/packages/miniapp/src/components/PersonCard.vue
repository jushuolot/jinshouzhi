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
    avatarBg: '#c45c26',
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
  background: #fff;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
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
  color: #333;
}
.rating {
  font-size: 24rpx;
  color: #f5a623;
  font-weight: 600;
}
.subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #888;
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
  color: #c45c26;
  background: #fff5ef;
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
  color: #666;
}
.extra {
  font-size: 22rpx;
  color: #999;
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
  background: #c45c26;
  border-radius: 32rpx;
}
</style>

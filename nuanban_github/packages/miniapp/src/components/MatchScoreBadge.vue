<template>
  <view class="badge" :class="tier">
    <text class="score">{{ score }}%</text>
    <text class="label">{{ label }}</text>
    <view class="bar">
      <view class="fill" :style="{ width: score + '%' }" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { matchScoreLabel } from '../utils/match-score';

const props = defineProps<{ score: number }>();

const label = computed(() => matchScoreLabel(props.score));
const tier = computed(() => {
  if (props.score >= 92) return 'high';
  if (props.score >= 85) return 'mid';
  return 'low';
});
</script>

<style scoped>
.badge {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid #f0e0d0;
}
.badge.high {
  border-color: #e88b4a;
  background: linear-gradient(135deg, #fff8f0, #fff);
}
.score {
  font-size: 36rpx;
  font-weight: 700;
  color: #c45c26;
}
.label {
  margin-left: 12rpx;
  font-size: 24rpx;
  color: #888;
}
.bar {
  margin-top: 12rpx;
  height: 8rpx;
  background: #eee;
  border-radius: 4rpx;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: linear-gradient(90deg, #e88b4a, #c45c26);
  border-radius: 4rpx;
  transition: width 0.6s ease;
}
.badge.mid .fill {
  background: linear-gradient(90deg, #f5b87a, #e88b4a);
}
.badge.low .fill {
  background: #ccc;
}
</style>

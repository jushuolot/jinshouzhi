<template>
  <view class="timeline">
    <view
      v-for="(step, idx) in steps"
      :key="step.key"
      class="step"
      :class="{
        done: idx < currentIndex,
        active: idx === currentIndex,
        future: idx > currentIndex,
      }"
    >
      <view class="dot-wrap">
        <view class="dot" />
        <view v-if="idx < steps.length - 1" class="line" />
      </view>
      <text class="label">{{ step.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { orderTimelineIndex, orderTimelineSteps } from '../utils/order-status';

const props = defineProps<{
  status: string;
  requiresOutdoor?: boolean;
}>();

const steps = computed(() => orderTimelineSteps(props.requiresOutdoor));
const currentIndex = computed(() =>
  props.status === 'cancelled' ? -1 : orderTimelineIndex(props.status, props.requiresOutdoor),
);
</script>

<style scoped>
.timeline {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 8rpx 8rpx;
}
.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.dot-wrap {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32rpx;
}
.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #ddd;
  z-index: 1;
}
.line {
  position: absolute;
  left: 50%;
  right: -50%;
  top: 50%;
  height: 4rpx;
  background: #eee;
  transform: translateY(-50%);
  z-index: 0;
}
.step.done .dot {
  background: #c45c26;
}
.step.done .line {
  background: #f0c9b0;
}
.step.active .dot {
  background: #c45c26;
  box-shadow: 0 0 0 6rpx rgba(196, 92, 38, 0.2);
}
.label {
  margin-top: 12rpx;
  font-size: 20rpx;
  color: #999;
  text-align: center;
  white-space: nowrap;
}
.step.active .label,
.step.done .label {
  color: #c45c26;
  font-weight: 500;
}
</style>

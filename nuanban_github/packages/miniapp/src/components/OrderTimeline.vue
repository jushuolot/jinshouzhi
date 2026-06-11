<template>
  <view v-if="isCancelled" class="cancelled-banner">订单已取消</view>
  <view class="timeline" :class="{ cancelled: isCancelled }">
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
const isCancelled = computed(() => props.status === 'cancelled');
const currentIndex = computed(() =>
  isCancelled.value ? -1 : orderTimelineIndex(props.status, props.requiresOutdoor),
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
  background: var(--nb-border, #ddd);
  z-index: 1;
}
.line {
  position: absolute;
  left: 50%;
  right: -50%;
  top: 50%;
  height: 4rpx;
  background: var(--nb-border-light, #eee);
  transform: translateY(-50%);
  z-index: 0;
}
.step.done .dot {
  background: var(--nb-primary, #c45c26);
}
.step.done .line {
  background: var(--nb-border-dashed, #f0c9b0);
}
.step.active .dot {
  background: var(--nb-primary, #c45c26);
  box-shadow: 0 0 0 6rpx rgba(196, 92, 38, 0.2);
}
.label {
  margin-top: 12rpx;
  font-size: 20rpx;
  color: var(--nb-text-muted, #999);
  text-align: center;
  white-space: nowrap;
}
.step.active .label,
.step.done .label {
  color: var(--nb-primary, #c45c26);
  font-weight: 500;
}
.timeline.cancelled {
  opacity: 0.45;
}
.cancelled-banner {
  text-align: center;
  font-size: 24rpx;
  color: #b71c1c;
  background: #ffebee;
  padding: 12rpx 16rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  margin-bottom: 12rpx;
}
</style>

<template>
  <view v-if="isCancelled" class="cancelled-banner">订单已取消</view>

  <view class="tracker">
    <view
      v-for="(row, idx) in rows"
      :key="row.key"
      class="track-row"
      :class="{ reached: row.reached, active: row.active, future: !row.reached }"
    >
      <view class="track-rail">
        <view class="track-dot" />
        <view v-if="idx < rows.length - 1" class="track-line" />
      </view>
      <view class="track-body">
        <view class="track-head">
          <text class="track-title">{{ row.label }}</text>
          <text v-if="row.at" class="track-time">{{ formatTime(row.at) }}</text>
        </view>
        <text v-if="row.detail && row.reached" class="track-detail">{{ row.detail }}</text>
        <text v-else-if="!row.reached" class="track-pending">待进行</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  formatTimelineTime,
  mergeTimelineForDisplay,
  type OrderTimelineEvent,
} from '../utils/order-timeline';
import { orderTimelineIndex, orderTimelineSteps } from '../utils/order-status';

const props = defineProps<{
  status: string;
  requiresOutdoor?: boolean;
  timeline?: OrderTimelineEvent[];
}>();

const steps = computed(() => orderTimelineSteps(props.requiresOutdoor));
const isCancelled = computed(() => props.status === 'cancelled');

const rows = computed(() => {
  const keys = steps.value.map((s) => s.key);
  const events = props.timeline ?? [];
  if (isCancelled.value) {
    return mergeTimelineForDisplay(keys, events, 'cancelled').map((r) => ({
      ...r,
      reached: !!r.at || events.some((e) => e.key === r.key),
    }));
  }
  const idx = orderTimelineIndex(props.status, props.requiresOutdoor);
  const currentKey = keys[idx] ?? props.status;
  return mergeTimelineForDisplay(keys, events, currentKey);
});

function formatTime(iso: string) {
  return formatTimelineTime(iso);
}
</script>

<style scoped>
.tracker {
  padding: 8rpx 0 16rpx;
}
.track-row {
  display: flex;
  gap: 16rpx;
  min-height: 72rpx;
}
.track-rail {
  width: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.track-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: var(--nb-border, #ddd);
  margin-top: 6rpx;
  z-index: 1;
}
.track-line {
  flex: 1;
  width: 4rpx;
  min-height: 24rpx;
  background: var(--nb-border-light, #eee);
  margin: 4rpx 0;
}
.track-row.reached .track-dot {
  background: var(--nb-primary, #c45c26);
}
.track-row.reached .track-line {
  background: #f0c9b0;
}
.track-row.active .track-dot {
  box-shadow: 0 0 0 6rpx rgba(196, 92, 38, 0.2);
}
.track-body {
  flex: 1;
  padding-bottom: 20rpx;
  min-width: 0;
}
.track-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12rpx;
}
.track-title {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--nb-text, #333);
}
.track-row.future .track-title {
  color: var(--nb-text-muted, #bbb);
  font-weight: 400;
}
.track-row.reached .track-title {
  color: var(--nb-primary, #c45c26);
}
.track-time {
  font-size: 22rpx;
  color: var(--nb-text-muted, #999);
  flex-shrink: 0;
}
.track-detail {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--nb-text-secondary, #666);
  line-height: 1.45;
}
.track-pending {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #ccc;
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

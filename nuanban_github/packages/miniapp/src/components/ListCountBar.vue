<template>
  <view v-if="count > 0" class="bar">
    <text class="text">共 {{ count }} 条</text>
    <text v-if="hint" class="hint">{{ hint }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  count: number;
  hint?: string;
}>();
</script>

<style scoped>
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 4rpx 16rpx;
  font-size: 24rpx;
  color: #999;
}
.hint {
  color: #bbb;
  font-size: 22rpx;
}
</style>

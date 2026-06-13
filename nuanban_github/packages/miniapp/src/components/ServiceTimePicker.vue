<template>
  <view class="time-picker">
    <text class="hint">点选你可接单的时间段（可多选）</text>
    <view
      v-for="slot in slots"
      :key="slot"
      class="slot-row"
      :class="{ active: selectedSet.has(slot), disabled }"
      @tap="toggle(slot)"
    >
      <text class="check">{{ selectedSet.has(slot) ? '☑' : '☐' }}</text>
      <text class="slot-text">{{ slot }}</text>
    </view>
    <text v-if="!modelValue.length && !disabled" class="warn">请至少选择一个时段</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SERVICE_TIME_SLOTS } from '../utils/service-time-slots';

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

const slots = SERVICE_TIME_SLOTS;
const selectedSet = computed(() => new Set(props.modelValue));

function toggle(slot: string) {
  if (props.disabled) return;
  const next = new Set(props.modelValue);
  if (next.has(slot)) next.delete(slot);
  else next.add(slot);
  emit('update:modelValue', [...next]);
}
</script>

<style scoped>
.hint {
  display: block;
  margin-bottom: 12rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
}
.slot-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 16rpx;
  margin-bottom: 8rpx;
  background: var(--nb-surface, #fff);
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}
.slot-row.active {
  border-color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
}
.slot-row.disabled {
  opacity: 0.7;
}
.check {
  font-size: 28rpx;
  color: var(--nb-primary, #c45c26);
}
.slot-text {
  font-size: 28rpx;
  color: var(--nb-text, #333);
}
.warn {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #c45c26;
}
</style>

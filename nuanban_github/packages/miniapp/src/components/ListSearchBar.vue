<template>
  <view class="search-bar">
    <text class="icon">🔍</text>
    <input
      class="search-input"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      confirm-type="search"
      aria-label="搜索"
      @input="onInput"
    />
    <text v-if="modelValue" class="clear" @tap="clear">清除</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    placeholder: '搜索姓名、手机号、学校…',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

function onInput(e: { detail: { value: string } }) {
  emit('update:modelValue', e.detail.value);
}

function clear() {
  emit('update:modelValue', '');
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
  padding: 0 20rpx;
  min-height: 72rpx;
  background: var(--nb-surface, #fff);
  border: 1rpx solid var(--nb-border, #eee);
  border-radius: 999rpx;
}
.icon {
  font-size: 28rpx;
  flex-shrink: 0;
  opacity: 0.55;
}
.search-input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  font-size: 28rpx;
  color: var(--nb-text, #1a1a1a);
}
.clear {
  flex-shrink: 0;
  font-size: 24rpx;
  color: var(--nb-primary, #c45c26);
  padding: 8rpx 0 8rpx 12rpx;
}
</style>

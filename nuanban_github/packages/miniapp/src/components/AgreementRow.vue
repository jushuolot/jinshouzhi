<template>
  <view class="agree-row" @tap="onToggle">
    <view class="check-box" :class="{ on: modelValue }">
      <text v-if="modelValue" class="check-mark">✓</text>
    </view>
    <text class="agree-text">
      我已阅读并同意
      <text class="inline-link" @tap.stop="emit('open-agreement')">《用户协议》</text>
      和
      <text class="inline-link" @tap.stop="emit('open-privacy')">《隐私政策》</text>
    </text>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'open-agreement': [];
  'open-privacy': [];
}>();

function onToggle() {
  emit('update:modelValue', !props.modelValue);
}
</script>

<style scoped>
.agree-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 4rpx 0;
}
.check-box {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
  margin-top: 2rpx;
  border: 2rpx solid #ccc;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  box-sizing: border-box;
}
.check-box.on {
  background: #c45c26;
  border-color: #c45c26;
}
.check-mark {
  font-size: 22rpx;
  color: #fff;
  font-weight: 700;
  line-height: 1;
}
.agree-text {
  flex: 1;
  font-size: 24rpx;
  color: #666;
  line-height: 1.55;
}
.inline-link {
  color: #c45c26;
}
</style>

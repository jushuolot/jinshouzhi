<template>
  <button
    v-if="visible"
    class="btn-call"
    :class="variant"
    :loading="loading"
    @tap="onTap"
  >
    <text v-if="variant === 'toolbar'" class="toolbar-icon">📞</text>
    {{ variant === 'toolbar' ? '通话' : '实时语音通话' }}
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { startOrderVoiceCall } from '../utils/order-voice-call';

const props = withDefaults(
  defineProps<{
    orderId: string;
    callOpen?: boolean;
    variant?: 'banner' | 'toolbar';
  }>(),
  { variant: 'banner' },
);

const loading = ref(false);

const visible = computed(() => props.callOpen === true);

async function onTap() {
  if (!props.orderId || loading.value) return;
  loading.value = true;
  try {
    await startOrderVoiceCall(props.orderId);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.btn-call {
  margin-bottom: 16rpx;
  background: #e8f5e9;
  color: #2e7d32;
  border: 2rpx solid #a5d6a7;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.btn-call.toolbar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  margin-bottom: 0;
  padding: 0 18rpx;
  height: 64rpx;
  line-height: 1;
  font-size: 22rpx;
  white-space: nowrap;
}
.toolbar-icon {
  font-size: 26rpx;
  line-height: 1;
}
</style>

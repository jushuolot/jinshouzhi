<template>
  <view v-if="visible" class="mask" @tap="onCancel">
    <view class="panel" @tap.stop>
      <text class="title">安全验证</text>
      <text class="prompt">{{ challenge?.prompt || '加载中…' }}</text>
      <view class="grid">
        <view
          v-for="tile in challenge?.tiles || []"
          :key="tile.id"
          class="tile"
          :class="{ picked: picked.has(tile.id) }"
          @tap="toggle(tile.id)"
        >
          <text class="emoji">{{ tile.emoji }}</text>
        </view>
      </view>
      <view class="actions">
        <button class="btn ghost" size="mini" @tap="refresh">换一组</button>
        <button class="btn ghost" size="mini" @tap="onCancel">取消</button>
        <button class="btn primary" size="mini" :loading="verifying" @tap="submit">确认</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  fetchCaptchaChallenge,
  verifyCaptchaChallenge,
  type CaptchaChallenge,
} from '../api/captcha-sms';
import { pbErrorMessage } from '../utils/request';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'verified', token: string): void;
}>();

const challenge = ref<CaptchaChallenge | null>(null);
const picked = ref(new Set<string>());
const verifying = ref(false);

async function load() {
  picked.value = new Set();
  try {
    challenge.value = await fetchCaptchaChallenge();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
    emit('cancel');
  }
}

function toggle(id: string) {
  const next = new Set(picked.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  picked.value = next;
}

async function refresh() {
  await load();
}

async function submit() {
  if (!challenge.value || verifying.value) return;
  if (picked.value.size === 0) {
    uni.showToast({ title: '请点选图案', icon: 'none' });
    return;
  }
  verifying.value = true;
  try {
    const res = await verifyCaptchaChallenge(challenge.value.challengeId, [...picked.value]);
    if (!res.ok || !res.captchaToken) {
      uni.showToast({ title: res.message || '验证失败', icon: 'none' });
      await load();
      return;
    }
    emit('verified', res.captchaToken);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
    await load();
  } finally {
    verifying.value = false;
  }
}

function onCancel() {
  emit('cancel');
}

watch(
  () => props.visible,
  (v) => {
    if (v) void load();
  },
);
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}
.panel {
  width: 100%;
  max-width: 620rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx 24rpx;
}
.title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
}
.prompt {
  display: block;
  margin: 16rpx 0 20rpx;
  font-size: 26rpx;
  color: #666;
  text-align: center;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}
.tile {
  aspect-ratio: 1;
  border-radius: 16rpx;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid transparent;
}
.tile.picked {
  border-color: #c45c26;
  background: #fff3e8;
}
.emoji {
  font-size: 52rpx;
}
.actions {
  margin-top: 24rpx;
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
}
.btn.ghost {
  background: #f0f0f0;
  color: #333;
}
.btn.primary {
  background: #c45c26;
  color: #fff;
}
</style>

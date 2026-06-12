<template>
  <view class="page">
    <view class="banner">
      <text class="banner-title">订单密聊</text>
      <text class="banner-sub">文字或语音沟通 · 双方仅见昵称代号 · 服务结束后自动关闭</text>
    </view>

    <view v-if="!threadOpen" class="closed">本单沟通通道已关闭</view>

    <scroll-view scroll-y class="msgs" :scroll-into-view="scrollTo">
      <view v-for="m in messages" :id="'m-' + m.id" :key="m.id" class="msg" :class="{ mine: m.mine }">
        <text class="alias">{{ m.senderAlias }}</text>
        <view v-if="m.type === 'voice'" class="bubble voice-bubble" @tap="playMessage(m)">
          <text class="voice-icon">{{ playingId === m.id ? '⏸' : '▶' }}</text>
          <view class="voice-bar">
            <view class="voice-fill" :style="{ width: voiceBarWidth(m) }" />
          </view>
          <text class="voice-dur">{{ m.durationSec || 1 }}″</text>
        </view>
        <view v-else class="bubble">{{ m.body }}</view>
        <text class="time">{{ formatTime(m.createdAt) }}</text>
      </view>
    </scroll-view>

    <view v-if="recording" class="record-overlay">
      <text class="record-hint">正在录音… 松开结束</text>
    </view>

    <view v-if="threadOpen" class="composer">
      <button
        class="voice-btn"
        :class="{ active: recording }"
        @touchstart.prevent="onVoiceStart"
        @touchend.prevent="onVoiceEnd"
        @touchcancel.prevent="onVoiceCancel"
        @mousedown.prevent="onVoiceStart"
        @mouseup.prevent="onVoiceEnd"
        @mouseleave.prevent="onVoiceCancel"
      >
        {{ recording ? '录音中' : '按住说话' }}
      </button>
      <input v-model="draft" class="input" placeholder="或输入文字…" confirm-type="send" @confirm="send" />
      <button class="send" size="mini" :loading="sending" @tap="send">发送</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import {
  fetchOrderMessages,
  sendOrderMessage,
  sendOrderVoiceMessage,
  type OrderChatMessage,
} from '../../api/order-chat';
import { formatTimelineTime } from '../../utils/order-timeline';
import { pbErrorMessage } from '../../utils/request';
import {
  cancelVoiceRecord,
  playVoiceAudio,
  startVoiceRecord,
  stopVoicePlayback,
  stopVoiceRecord,
  voiceFileToBase64,
} from '../../utils/voice-chat';

const orderId = ref('');
const messages = ref<OrderChatMessage[]>([]);
const threadOpen = ref(true);
const draft = ref('');
const sending = ref(false);
const recording = ref(false);
const playingId = ref('');
const scrollTo = ref('');

function formatTime(iso: string) {
  return formatTimelineTime(iso);
}

function voiceBarWidth(m: OrderChatMessage) {
  const sec = Math.min(60, Math.max(1, m.durationSec || 1));
  return `${Math.round((sec / 60) * 100)}%`;
}

async function reload() {
  if (!orderId.value) return;
  try {
    const res = await fetchOrderMessages(orderId.value);
    messages.value = res.list ?? [];
    threadOpen.value = res.threadOpen !== false;
    const last = messages.value[messages.value.length - 1];
    if (last) scrollTo.value = `m-${last.id}`;
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

async function send() {
  const text = draft.value.trim();
  if (!text || !orderId.value || sending.value) return;
  sending.value = true;
  try {
    await sendOrderMessage(orderId.value, text);
    draft.value = '';
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    sending.value = false;
  }
}

async function onVoiceStart() {
  if (recording.value || sending.value || !threadOpen.value) return;
  recording.value = true;
  try {
    await startVoiceRecord();
  } catch (e) {
    recording.value = false;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

async function onVoiceEnd() {
  if (!recording.value) return;
  recording.value = false;
  sending.value = true;
  try {
    const clip = await stopVoiceRecord();
    const audioBase64 = await voiceFileToBase64(clip.tempFilePath);
    await sendOrderVoiceMessage(orderId.value, audioBase64, clip.durationSec, clip.mimeType);
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    sending.value = false;
  }
}

function onVoiceCancel() {
  if (!recording.value) return;
  recording.value = false;
  cancelVoiceRecord();
}

async function playMessage(m: OrderChatMessage) {
  if (!m.audioUrl) {
    uni.showToast({ title: '语音不可用', icon: 'none' });
    return;
  }
  if (playingId.value === m.id) {
    stopVoicePlayback();
    playingId.value = '';
    return;
  }
  playingId.value = m.id;
  try {
    await playVoiceAudio(m.audioUrl);
  } catch {
    uni.showToast({ title: '播放失败', icon: 'none' });
  } finally {
    playingId.value = '';
  }
}

onLoad((q) => {
  orderId.value = String(q?.orderId || '');
});

onShow(() => {
  void reload();
});

onUnload(() => {
  stopVoicePlayback();
  cancelVoiceRecord();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--nb-page-bg, #f5f5f5);
}
.banner {
  padding: 20rpx 24rpx;
  background: #fff8f0;
  border-bottom: 1rpx solid #f0dcc8;
}
.banner-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.banner-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
  line-height: 1.4;
}
.closed {
  padding: 24rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
.msgs {
  flex: 1;
  height: 60vh;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
}
.msg {
  margin-bottom: 20rpx;
  max-width: 80%;
}
.msg.mine {
  margin-left: auto;
  text-align: right;
}
.alias {
  display: block;
  font-size: 20rpx;
  color: #999;
  margin-bottom: 4rpx;
}
.bubble {
  display: inline-block;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: #fff;
  font-size: 28rpx;
  text-align: left;
}
.msg.mine .bubble {
  background: #fff3e8;
}
.voice-bubble {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  min-width: 200rpx;
  cursor: pointer;
}
.voice-icon {
  font-size: 24rpx;
  color: var(--nb-primary, #c45c26);
}
.voice-bar {
  flex: 1;
  height: 8rpx;
  background: #eee;
  border-radius: 4rpx;
  overflow: hidden;
}
.voice-fill {
  height: 100%;
  background: var(--nb-primary, #c45c26);
  border-radius: 4rpx;
}
.voice-dur {
  font-size: 22rpx;
  color: #666;
}
.time {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #bbb;
}
.record-overlay {
  position: fixed;
  left: 50%;
  bottom: 180rpx;
  transform: translateX(-50%);
  padding: 20rpx 32rpx;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  border-radius: 16rpx;
  z-index: 10;
}
.record-hint {
  font-size: 26rpx;
}
.composer {
  display: flex;
  gap: 12rpx;
  align-items: center;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #eee;
}
.voice-btn {
  flex-shrink: 0;
  padding: 0 16rpx;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 22rpx;
  background: #f5f5f5;
  color: #333;
  border-radius: 12rpx;
}
.voice-btn.active {
  background: #ffe8d6;
  color: var(--nb-primary, #c45c26);
}
.input {
  flex: 1;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.send {
  background: var(--nb-primary, #c45c26);
  color: #fff;
}
</style>

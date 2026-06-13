<template>
  <view class="page">
    <view class="card">
      <text class="self-role">我方 · {{ selfRoleLabel }}</text>
      <text class="peer">对方 · {{ peerAlias || '订单语音' }}</text>
      <text class="status">{{ statusLabel }}</text>
      <text class="hint">{{ hint }}</text>
    </view>

    <view id="remote-audio-host" class="audio-host" />

    <view class="actions">
      <button class="btn mute" :class="{ active: muted }" @tap="toggleMute">
        {{ muted ? '取消静音' : '静音' }}
      </button>
      <button class="btn hangup" @tap="onHangup">挂断</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { initiateOrderCall, pollOrderCallSignals } from '../../api/order-call';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';
import {
  startWebRtcVoiceCall,
  type VoiceCallStatus,
  type WebRtcVoiceSession,
} from '../../utils/webrtc-voice-call';

const orderId = ref('');
const isInitiator = ref(true);
const peerAlias = ref('');
const hint = ref('');
const status = ref<VoiceCallStatus>('connecting');
const muted = ref(false);

const roleStore = useRoleStore();
const selfRoleLabel = computed(() => {
  const map: Record<string, string> = {
    student: '陪护同学',
    elder: '老人',
    family: '家属',
  };
  return map[roleStore.activeRole || ''] || '用户';
});

let session: WebRtcVoiceSession | null = null;
let remoteAudioEl: HTMLAudioElement | null = null;

const statusLabel = computed(() => {
  if (status.value === 'connecting') return '连接中…';
  if (status.value === 'connected') return '通话中';
  if (status.value === 'ended') return '已结束';
  return '连接失败';
});

function attachRemoteStream(stream: MediaStream) {
  // #ifdef H5
  if (!remoteAudioEl) {
    remoteAudioEl = document.createElement('audio');
    remoteAudioEl.autoplay = true;
    remoteAudioEl.setAttribute('playsinline', 'true');
    const host = document.getElementById('remote-audio-host');
    host?.appendChild(remoteAudioEl);
  }
  remoteAudioEl.srcObject = stream;
  remoteAudioEl.play().catch(() => {});
  // #endif
}

async function bootstrapCall() {
  if (!orderId.value) return;
  try {
    const callInfo = await initiateOrderCall(orderId.value);
    if (!callInfo.callOpen || callInfo.mode !== 'webrtc') {
      uni.showToast({ title: callInfo.hint || '当前不可语音通话', icon: 'none' });
      setTimeout(() => uni.navigateBack(), 1500);
      return;
    }
    peerAlias.value = callInfo.peerAlias;
    hint.value = callInfo.hint;
    if (!callInfo.clientId || !callInfo.iceServers?.length) {
      uni.showToast({ title: '通话配置不完整', icon: 'none' });
      return;
    }
    let offerInitiator = isInitiator.value;
    try {
      const pre = await pollOrderCallSignals(orderId.value, callInfo.clientId, 0);
      const peerAlreadyJoined = (pre.signals || []).some(
        (s) => s.type === 'join' && s.clientId !== callInfo.clientId,
      );
      if (peerAlreadyJoined) offerInitiator = false;
    } catch {
      /* use query default */
    }
    session = await startWebRtcVoiceCall({
      orderId: orderId.value,
      clientId: callInfo.clientId,
      iceServers: callInfo.iceServers,
      isInitiator: offerInitiator,
      onStatus: (s) => {
        status.value = s;
        if (s === 'ended') {
          setTimeout(() => uni.navigateBack(), 800);
        }
      },
      onRemoteStream: attachRemoteStream,
      onError: (msg) => {
        uni.showToast({ title: msg, icon: 'none' });
        status.value = 'error';
      },
    });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
    status.value = 'error';
  }
}

function toggleMute() {
  muted.value = !muted.value;
  session?.setMuted(muted.value);
}

function onHangup() {
  session?.hangup();
  uni.navigateBack();
}

onLoad((q) => {
  orderId.value = String(q?.orderId || '');
  isInitiator.value = String(q?.initiator || '1') !== '0';
  bootstrapCall();
});

onUnload(() => {
  session?.cleanup();
  session = null;
  if (remoteAudioEl) {
    remoteAudioEl.srcObject = null;
    remoteAudioEl.remove();
    remoteAudioEl = null;
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48rpx 32rpx;
  background: linear-gradient(180deg, #e8f5e9 0%, #fff 40%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card {
  margin-top: 120rpx;
  text-align: center;
}
.peer {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #1b5e20;
}
.self-role {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #888;
}
.status {
  display: block;
  margin-top: 24rpx;
  font-size: 32rpx;
  color: #388e3c;
}
.hint {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #666;
  padding: 0 32rpx;
}
.audio-host {
  width: 0;
  height: 0;
  overflow: hidden;
}
.actions {
  margin-top: auto;
  padding-bottom: 80rpx;
  display: flex;
  gap: 32rpx;
  width: 100%;
  justify-content: center;
}
.btn {
  min-width: 200rpx;
  border-radius: 48rpx;
  font-size: 28rpx;
}
.mute {
  background: #fff;
  color: #333;
  border: 2rpx solid #ccc;
}
.mute.active {
  background: #fff3e0;
  border-color: #ffb74d;
}
.hangup {
  background: #e53935;
  color: #fff;
}
</style>

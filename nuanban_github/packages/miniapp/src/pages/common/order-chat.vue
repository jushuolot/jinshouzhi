<template>
  <view class="page">
    <view class="banner">
      <text class="banner-title">订单密聊</text>
      <text class="banner-sub">双方仅见昵称代号，不暴露手机号/微信号 · 服务结束后自动关闭</text>
    </view>

    <view v-if="!threadOpen" class="closed">本单沟通通道已关闭</view>

    <scroll-view scroll-y class="msgs" :scroll-into-view="scrollTo">
      <view v-for="m in messages" :id="'m-' + m.id" :key="m.id" class="msg" :class="{ mine: m.mine }">
        <text class="alias">{{ m.senderAlias }}</text>
        <view class="bubble">{{ m.body }}</view>
        <text class="time">{{ formatTime(m.createdAt) }}</text>
      </view>
    </scroll-view>

    <view v-if="threadOpen" class="composer">
      <input v-model="draft" class="input" placeholder="输入消息…" confirm-type="send" @confirm="send" />
      <button class="send" size="mini" :loading="sending" @tap="send">发送</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { fetchOrderMessages, sendOrderMessage, type OrderChatMessage } from '../../api/order-chat';
import { formatTimelineTime } from '../../utils/order-timeline';
import { pbErrorMessage } from '../../utils/request';

const orderId = ref('');
const messages = ref<OrderChatMessage[]>([]);
const threadOpen = ref(true);
const draft = ref('');
const sending = ref(false);
const scrollTo = ref('');

function formatTime(iso: string) {
  return formatTimelineTime(iso);
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

onLoad((q) => {
  orderId.value = String(q?.orderId || '');
});

onShow(() => {
  void reload();
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
.time {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #bbb;
}
.composer {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #eee;
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

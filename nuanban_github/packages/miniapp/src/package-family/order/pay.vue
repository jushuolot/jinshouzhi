<template>
  <view class="page">
    <view v-if="!orderId" class="hint">请从「订单」Tab 进入待支付订单</view>
    <view v-else class="card">
      <text class="badge">待支付</text>
      <text class="svc">{{ serviceName || '陪护服务' }}</text>
      <text class="elder">服务对象：{{ elderName || '—' }}</text>
      <text v-if="scheduledAt" class="meta">预约：{{ formatTime(scheduledAt) }}</text>
      <text class="price">应付 ¥{{ (amountCents / 100).toFixed(0) }}</text>
    </view>
    <button class="btn" :loading="loading" :disabled="!orderId" @tap="pay">模拟支付</button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { payOrder } from '../../api/family';
import { pbGet } from '../../api/pb';
import { pbErrorMessage } from '../../utils/request';

const orderId = ref('');
const amountCents = ref(0);
const elderName = ref('');
const serviceName = ref('');
const scheduledAt = ref('');
const loading = ref(false);

onLoad(async (q) => {
  orderId.value = (q?.id as string) || '';
  if (!orderId.value) return;
  try {
    const o = await pbGet<{
      amount_cents?: number;
      scheduled_at?: string;
      expand?: { elder?: { name: string }; service_item?: { name: string } };
    }>('orders', orderId.value);
    amountCents.value = o.amount_cents || 0;
    scheduledAt.value = o.scheduled_at || '';
    elderName.value = o.expand?.elder?.name || '';
    serviceName.value = o.expand?.service_item?.name || '';
  } catch {
    amountCents.value = 0;
  }
});

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

async function pay() {
  if (!orderId.value) return;
  loading.value = true;
  try {
    await payOrder(orderId.value);
    uni.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page { padding: 48rpx; }
.hint { color: #999; text-align: center; }
.card { padding: 32rpx; background: #fff; border-radius: 16rpx; }
.badge { display: inline-block; padding: 4rpx 16rpx; font-size: 22rpx; color: #c45c26; background: #ffe8d9; border-radius: 8rpx; }
.svc { display: block; margin-top: 20rpx; font-size: 36rpx; font-weight: 600; }
.elder, .meta { display: block; margin-top: 12rpx; color: #666; font-size: 28rpx; }
.price { display: block; margin-top: 24rpx; font-size: 40rpx; color: #c45c26; font-weight: 600; }
.btn { margin-top: 48rpx; background: #c45c26; color: #fff; }
</style>

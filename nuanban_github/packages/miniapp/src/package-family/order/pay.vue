<template>
  <view class="page">
    <view v-if="!orderId" class="hint">请从首页「待支付订单」或订单列表进入</view>
    <view v-else class="card">
      <text>订单 {{ orderId.slice(0, 8) }}</text>
      <text v-if="amountCents" class="meta">应付 ¥{{ (amountCents / 100).toFixed(0) }}</text>
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
const loading = ref(false);

onLoad(async (q) => {
  orderId.value = (q?.id as string) || '';
  if (!orderId.value) return;
  try {
    const o = await pbGet<{ amount_cents?: number }>('orders', orderId.value);
    amountCents.value = o.amount_cents || 0;
  } catch {
    amountCents.value = 0;
  }
});

async function pay() {
  if (!orderId.value) return;
  loading.value = true;
  try {
    await payOrder(orderId.value);
    uni.showToast({ title: '支付成功', icon: 'success' });
    uni.navigateBack();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page {
  padding: 48rpx;
}
.hint {
  color: #999;
  text-align: center;
  margin-bottom: 32rpx;
}
.card {
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
}
.meta {
  display: block;
  margin-top: 12rpx;
  color: #666;
}
.btn {
  margin-top: 48rpx;
  background: #c45c26;
  color: #fff;
}
</style>

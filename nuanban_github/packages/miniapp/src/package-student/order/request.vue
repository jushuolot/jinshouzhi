<template>
  <view class="page">
    <view v-if="!id" class="hint">请从首页「待接单」进入</view>
    <view v-else class="card">
      <text>订单 {{ id.slice(0, 8) }}</text>
      <text v-if="order" class="meta">老人 {{ order.elderId?.slice(0, 6) }}</text>
      <text v-if="order" class="meta">金额 ¥{{ ((order.amountCents || 0) / 100).toFixed(0) }}</text>
    </view>
    <button class="btn-ok" :loading="loading" :disabled="!id" @tap="accept">接受订单</button>
    <button class="btn-no" :disabled="!id" @tap="reject">拒绝</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { acceptOrder, rejectOrder, listPendingOrders, type PendingOrder } from '../../api/student';
import { pbErrorMessage } from '../../utils/request';

const id = ref('');
const order = ref<PendingOrder | null>(null);
const loading = ref(false);

onLoad(async (q) => {
  if (q?.id) id.value = q.id as string;
  if (!id.value) return;
  try {
    const list = await listPendingOrders();
    order.value = list.find((o) => o.id === id.value) ?? null;
  } catch {
    order.value = null;
  }
});

async function accept() {
  if (!id.value) return;
  loading.value = true;
  try {
    await acceptOrder(id.value);
    uni.showToast({ title: '已接单', icon: 'success' });
    uni.navigateBack();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function reject() {
  if (!id.value) return;
  try {
    await rejectOrder(id.value);
    uni.navigateBack();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}
</script>

<style scoped>
.hint {
  margin: 48rpx;
  color: #999;
  text-align: center;
}
.card {
  margin: 32rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
}
.meta {
  display: block;
  margin-top: 8rpx;
  color: #666;
}
.btn-ok {
  margin: 48rpx;
  background: #2e7d32;
  color: #fff;
}
.btn-no {
  margin: 0 48rpx;
  background: #eee;
}
</style>

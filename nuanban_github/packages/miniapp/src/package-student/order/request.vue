<template>
  <view class="page">
    <view v-if="!id" class="hint">请从「接单」Tab 进入</view>
    <template v-else>
      <view class="card">
        <text class="svc">{{ order?.serviceName || '陪护服务' }}</text>
        <view class="row">
          <text class="label">服务老人</text>
          <text class="value">{{ order?.elderName || '—' }}</text>
        </view>
        <view class="row">
          <text class="label">预约时间</text>
          <text class="value">{{ formatTime(order?.scheduledAt) }}</text>
        </view>
        <view class="row">
          <text class="label">服务费用</text>
          <text class="value price">¥{{ ((order?.amountCents || 0) / 100).toFixed(0) }}</text>
        </view>
      </view>
      <button class="btn-ok" :loading="loading" @tap="accept">接受订单</button>
      <button class="btn-no" :disabled="loading" @tap="reject">拒绝</button>
    </template>
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

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.hint {
  margin: 48rpx;
  color: #999;
  text-align: center;
}
.card {
  padding: 32rpx 28rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}
.svc {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 0;
  font-size: 28rpx;
}
.label {
  color: #999;
}
.value.price {
  color: #c45c26;
  font-weight: 600;
}
.btn-ok {
  background: #2e7d32;
  color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}
.btn-no {
  background: #fff;
  color: #666;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
}
</style>

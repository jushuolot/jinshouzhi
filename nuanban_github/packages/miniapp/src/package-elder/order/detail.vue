<template>
  <view class="page elder-mode">
    <view v-if="order" class="card">
      <text class="status">{{ statusLabel(order.status) }}</text>
      <OrderTimeline :status="order.status" :requires-outdoor="requiresOutdoor" />
      <text class="svc">{{ serviceName }}</text>
      <text class="meta">预约：{{ formatTime(order.scheduled_at) }}</text>
      <text class="meta">费用：¥{{ ((order.amount_cents || 0) / 100).toFixed(0) }}</text>
    </view>
    <text v-else class="hint">加载中…</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import OrderTimeline from '../../components/OrderTimeline.vue';
import { getOrder, type OrderRow } from '../../api/elder';
import { orderStatusLabel } from '../../utils/order-status';
import { pbErrorMessage } from '../../utils/request';

const order = ref<
  (OrderRow & {
    expand?: {
      service_item?: { name: string; requires_outdoor_approval?: boolean };
    };
  }) | null
>(null);

const serviceName = computed(() => order.value?.expand?.service_item?.name || '陪护服务');
const requiresOutdoor = computed(
  () => order.value?.expand?.service_item?.requires_outdoor_approval === true,
);

function statusLabel(s: string) {
  return orderStatusLabel(s);
}

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onLoad(async (q) => {
  const id = q?.id as string;
  if (!id) return;
  try {
    order.value = await getOrder(id);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx 28rpx;
}
.status {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #c45c26;
  margin-bottom: 16rpx;
}
.svc {
  display: block;
  margin-top: 24rpx;
  font-size: 34rpx;
  font-weight: 600;
}
.meta {
  display: block;
  margin-top: 12rpx;
  color: #666;
  font-size: 28rpx;
}
.hint {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>

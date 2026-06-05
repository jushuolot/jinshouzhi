<template>
  <view class="page">
    <text class="tip">待服务 / 服务中的订单</text>
    <view v-for="o in list" :key="o.id" class="card" @tap="open(o.id)">
      <view class="card-head">
        <text class="svc">{{ o.serviceName || '陪护服务' }}</text>
        <text class="status-tag" :class="o.status">{{ statusLabel(o.status) }}</text>
      </view>
      <text class="elder">服务老人 · {{ o.elderName || '—' }}</text>
      <text class="meta">{{ formatTime(o.scheduledAt) }} · ¥{{ ((o.amountCents || 0) / 100).toFixed(0) }}</text>
    </view>
    <view v-if="!loading && !list.length" class="empty">暂无进行中订单</view>
    <RoleTabBar role="student" current="/package-student/order/active" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import { listActiveOrders, type PendingOrder } from '../../api/student';
import { orderStatusLabel } from '../../utils/order-status';
import { pbErrorMessage } from '../../utils/request';

const list = ref<PendingOrder[]>([]);
const loading = ref(false);

function statusLabel(s: string) {
  return orderStatusLabel(s);
}

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    list.value = await listActiveOrders();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(reload);

function open(id: string) {
  uni.navigateTo({ url: `/package-student/order/request?id=${id}` });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.tip {
  color: #666;
  font-size: 26rpx;
}
.card {
  background: #fff;
  padding: 28rpx 24rpx;
  margin-top: 16rpx;
  border-radius: 12rpx;
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.svc {
  font-size: 32rpx;
  font-weight: 600;
}
.status-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #fff5ef;
  color: #c45c26;
}
.status-tag.in_service {
  background: #e8f5e9;
  color: #2e7d32;
}
.elder {
  display: block;
  margin-top: 12rpx;
  color: #666;
  font-size: 26rpx;
}
.meta {
  display: block;
  margin-top: 8rpx;
  color: #999;
  font-size: 24rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
</style>

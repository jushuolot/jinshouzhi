<template>
  <view class="page">
    <view v-if="!id" class="hint">请从「接单」或「服务中」进入</view>
    <template v-else-if="order">
      <view class="status-bar">
        <text class="status-text">{{ statusLabel(order.status) }}</text>
      </view>

      <view class="card">
        <OrderTimeline :status="order.status" :requires-outdoor="order.requiresOutdoorApproval" />
      </view>

      <view class="card info">
        <text class="svc">{{ order.serviceName || '陪护服务' }}</text>
        <view class="row">
          <text class="label">服务老人</text>
          <text class="value">{{ order.elderName || '—' }}</text>
        </view>
        <view v-if="order.orgName" class="row">
          <text class="label">所属机构</text>
          <text class="value">{{ order.orgName }}</text>
        </view>
        <view v-if="order.distanceKm != null" class="row">
          <text class="label">距离</text>
          <text class="value">{{ formatDistance(order.distanceKm) }}</text>
        </view>
        <view class="row">
          <text class="label">预约时间</text>
          <text class="value">{{ formatTime(order.scheduledAt) }}</text>
        </view>
        <view class="row">
          <text class="label">服务费用</text>
          <text class="value price">¥{{ ((order.amountCents || 0) / 100).toFixed(0) }}</text>
        </view>
      </view>

      <button v-if="order.status === 'pending_accept'" class="btn-ok" :loading="loading" @tap="accept">
        接受订单
      </button>
      <button v-if="order.status === 'pending_accept'" class="btn-no" :disabled="loading" @tap="reject">
        拒绝
      </button>
      <button v-if="order.status === 'pending_service'" class="btn-ok" @tap="goCheckin">
        到场签到
      </button>
      <button v-if="order.status === 'in_service'" class="btn-ok" :loading="loading" @tap="complete">
        完成服务
      </button>
      <view v-if="order.status === 'completed'" class="done-hint">本单已完成 · 收入已计入 · 待月结结算</view>
    </template>
    <view v-else class="hint">订单不存在或已失效</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import OrderTimeline from '../../components/OrderTimeline.vue';
import {
  acceptOrder,
  rejectOrder,
  getStudentOrder,
  completeOrder,
  type StudentOrderDetail,
} from '../../api/student';
import { orderStatusLabel } from '../../utils/order-status';
import { pbErrorMessage } from '../../utils/request';

const id = ref('');
const order = ref<StudentOrderDetail | null>(null);
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

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

async function loadOrder() {
  if (!id.value) return;
  try {
    order.value = await getStudentOrder(id.value);
  } catch {
    order.value = null;
  }
}

onLoad((q) => {
  if (q?.id) id.value = q.id as string;
});

onShow(loadOrder);

async function accept() {
  if (!id.value) return;
  loading.value = true;
  try {
    await acceptOrder(id.value);
    uni.showToast({ title: '已接单', icon: 'success' });
    await loadOrder();
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

function goCheckin() {
  if (!id.value) return;
  uni.navigateTo({ url: `/package-student/schedule/checkin?orderId=${id.value}` });
}

async function complete() {
  if (!id.value) return;
  loading.value = true;
  try {
    await completeOrder(id.value);
    uni.showToast({ title: '已完成 · 已计入收入与待结算', icon: 'success', duration: 2500 });
    await loadOrder();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
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
.status-bar {
  margin-bottom: 16rpx;
}
.status-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #c45c26;
}
.card {
  padding: 24rpx 20rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}
.card.info {
  padding: 32rpx 28rpx;
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
.done-hint {
  text-align: center;
  color: #2e7d32;
  font-size: 28rpx;
  padding: 24rpx;
}
</style>

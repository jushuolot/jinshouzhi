<template>
  <view class="page">
    <view v-if="order" class="card">
      <text class="status">{{ statusLabel(order.status) }}</text>
      <OrderTimeline :status="order.status" :requires-outdoor="requiresOutdoor" />
      <text class="svc">{{ serviceName }}</text>
      <view class="row">
        <text class="label">老人</text>
        <text class="value">{{ elderName }}</text>
      </view>
      <view class="row">
        <text class="label">预约时间</text>
        <text class="value">{{ formatTime(order.scheduled_at) }}</text>
      </view>
      <view class="row">
        <text class="label">金额</text>
        <text class="value price">¥{{ ((order.amount_cents || 0) / 100).toFixed(0) }}</text>
      </view>
      <view class="row">
        <text class="label">支付状态</text>
        <text class="value">{{ paymentLabel }}</text>
      </view>
    </view>
    <view v-else class="empty">加载中或订单不存在</view>

    <button v-if="order?.status === 'pending_payment'" class="btn" @tap="goPay">去支付</button>
    <button
      v-if="order?.status === 'pending_confirm'"
      class="btn"
      :loading="confirming"
      @tap="confirmComplete"
    >
      {{ confirmBtnLabel }}
    </button>
    <button v-if="order?.status === 'outdoor_pending'" class="btn-outline" @tap="goOutdoor">
      外出审批
    </button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import OrderTimeline from '../../components/OrderTimeline.vue';
import { confirmOrderComplete, getFamilyOrder } from '../../api/family';
import { fetchFamilyWallet } from '../../api/wallet';
import { orderStatusLabel } from '../../utils/order-status';
import { pbErrorMessage } from '../../utils/request';

interface FamilyOrderDetail {
  id: string;
  status: string;
  amount_cents?: number;
  scheduled_at?: string;
  payment_status?: string;
  elderName?: string;
  serviceName?: string;
  requiresOutdoorApproval?: boolean;
}

const orderId = ref('');
const order = ref<FamilyOrderDetail | null>(null);
const confirming = ref(false);
const walletBalanceCents = ref(0);

const confirmBtnLabel = computed(() =>
  order.value?.payment_status === 'unpaid' ? '确认服务并付款' : '确认服务完成',
);

const serviceName = computed(() => order.value?.serviceName || '陪护服务');
const elderName = computed(() => order.value?.elderName || '老人');
const requiresOutdoor = computed(() => order.value?.requiresOutdoorApproval === true);
const paymentLabel = computed(() => {
  const p = order.value?.payment_status;
  if (p === 'paid') return '已支付';
  if (p === 'unpaid') return '待支付';
  return p || '—';
});

function statusLabel(s: string) {
  return orderStatusLabel(s);
}

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function load() {
  if (!orderId.value) return;
  try {
    const [detail, wallet] = await Promise.all([
      getFamilyOrder(orderId.value),
      fetchFamilyWallet().catch(() => null),
    ]);
    order.value = detail;
    if (wallet) walletBalanceCents.value = wallet.balanceCents;
  } catch (e) {
    order.value = null;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

onLoad((q) => {
  if (q?.id) orderId.value = q.id as string;
});

onShow(load);

function goPay() {
  uni.navigateTo({ url: `/package-family/order/pay?id=${orderId.value}` });
}

function goOutdoor() {
  uni.navigateTo({ url: `/package-family/outdoor/approve?id=${orderId.value}` });
}

async function confirmComplete() {
  if (!orderId.value || !order.value) return;
  const needsPay = order.value.payment_status === 'unpaid';
  const amountCents = order.value.amount_cents || 0;
  const amount = (amountCents / 100).toFixed(2);
  const useWallet = needsPay && walletBalanceCents.value >= amountCents;
  uni.showModal({
    title: needsPay ? '确认服务并付款' : '确认服务完成',
    content: needsPay
      ? useWallet
        ? `同学已完成服务，使用储值卡支付 ¥${amount}？`
        : `同学已完成服务，确认并支付 ¥${amount}？（演示，不产生真实扣款）`
      : '同学已完成服务，确认后订单将完结并计入同学收入。',
    success: async (res) => {
      if (!res.confirm) return;
      confirming.value = true;
      try {
        await confirmOrderComplete(orderId.value, useWallet ? 'wallet' : undefined);
        uni.showToast({
          title: needsPay ? (useWallet ? '储值卡已扣款' : '已确认并付款') : '已确认完成',
          icon: 'success',
        });
        await load();
      } catch (e) {
        uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
      } finally {
        confirming.value = false;
      }
    },
  });
}
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
  margin-bottom: 24rpx;
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
.btn {
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
.btn-outline {
  background: #fff;
  color: #c45c26;
  border: 2rpx solid #c45c26;
  border-radius: 12rpx;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>

<template>
  <view class="page elder-mode">
    <view v-if="order" class="card">
      <text class="status">{{ statusLabel(order.status) }}</text>
      <OrderTimeline
        :status="order.status"
        :requires-outdoor="requiresOutdoor"
        :timeline="order.timeline"
      />
      <text class="svc">{{ serviceName }}</text>
      <text class="meta">预约：{{ formatTime(order.scheduled_at) }}</text>
      <text class="meta">费用：¥{{ ((order.amount_cents || 0) / 100).toFixed(0) }}</text>
      <text v-if="caregiverName" class="meta">陪护同学：{{ caregiverName }}</text>
      <text v-if="order.payment_status" class="meta">
        支付：{{ order.payment_status === 'paid' ? '已支付' : '待支付' }}
      </text>
    </view>
    <text v-else-if="!loading" class="hint">订单不存在或加载失败</text>
    <text v-else class="hint">加载中…</text>

    <button v-if="order?.chatOpen" class="btn-outline" @tap="goChat">联系对方（订单密聊）</button>
    <button
      v-if="order?.status === 'pending_confirm'"
      class="btn"
      :loading="confirming"
      @tap="confirmComplete"
    >
      {{ confirmBtnLabel }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import OrderTimeline from '../../components/OrderTimeline.vue';
import { confirmOrderComplete, getOrder, type ElderOrderDetail } from '../../api/elder';
import { fetchElderWallet } from '../../api/wallet';
import { orderStatusLabel } from '../../utils/order-status';
import { readRouteQuery } from '../../utils/route-query';
import { ensureElderPaymentReady } from '../../utils/elder-payment-guard';
import { pbErrorMessage } from '../../utils/request';

const orderId = ref('');
const loading = ref(false);
const confirming = ref(false);
const walletBalanceCents = ref(0);
const order = ref<ElderOrderDetail | null>(null);

const caregiverName = computed(() => order.value?.studentName);

const confirmBtnLabel = computed(() =>
  order.value?.payment_status === 'unpaid' ? '确认服务并付款' : '确认服务完成',
);

const serviceName = computed(() => order.value?.serviceName || '陪护服务');
const requiresOutdoor = computed(() => order.value?.requiresOutdoorApproval === true);

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
  if (!orderId.value) {
    order.value = null;
    return;
  }
  loading.value = true;
  try {
    const [detail, wallet] = await Promise.all([
      getOrder(orderId.value),
      fetchElderWallet().catch(() => null),
    ]);
    order.value = detail;
    if (wallet) walletBalanceCents.value = wallet.balanceCents;
  } catch (e) {
    order.value = null;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onLoad((q) => {
  orderId.value = readRouteQuery(q, 'id');
});

onShow(load);

function goChat() {
  uni.navigateTo({ url: `/pages/common/order-chat?orderId=${orderId.value}` });
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
      : '同学已完成服务，确认后订单将完结。',
    success: async (res) => {
      if (!res.confirm) return;
      if (needsPay && !useWallet) {
        const ok = await ensureElderPaymentReady('确认服务并付款');
        if (!ok) return;
      }
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
  display: block;
  text-align: center;
  color: #999;
  padding: 80rpx;
}
.btn {
  margin-top: 32rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
.btn-outline {
  margin-top: 24rpx;
  background: #fff;
  color: #c45c26;
  border: 1rpx solid #c45c26;
  border-radius: 12rpx;
}
</style>

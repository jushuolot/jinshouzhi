<template>
  <view class="page">
    <view v-if="!orderId" class="hint">请从「订单」Tab 进入待支付订单</view>

    <template v-else>
      <view v-if="phase === 'success'" class="success-card">
        <text class="success-icon">✓</text>
        <text class="success-title">支付成功</text>
        <text class="success-desc">订单已进入待接单池，陪护同学将尽快响应</text>
        <button class="btn" @tap="goOrders">查看订单</button>
      </view>

      <template v-else>
        <view class="card">
          <text class="badge">待支付</text>
          <text class="svc">{{ serviceName || '陪护服务' }}</text>
          <text class="elder">服务对象：{{ elderName || '—' }}</text>
          <text v-if="scheduledAt" class="meta">预约：{{ formatTime(scheduledAt) }}</text>
          <view class="amount-row">
            <text class="amount-label">应付金额</text>
            <text class="price">¥{{ (amountCents / 100).toFixed(2) }}</text>
          </view>
        </view>

        <view v-if="phase === 'paying'" class="wx-pay-overlay">
          <view class="wx-pay-box">
            <text class="wx-logo">微信支付</text>
            <view class="wx-spinner" />
            <text class="wx-hint">正在支付…</text>
          </view>
        </view>

        <view v-if="phase === 'idle'" class="pay-methods">
          <view
            class="method"
            :class="{ active: payMethod === 'wallet' }"
            @tap="payMethod = 'wallet'"
          >
            <text class="method-icon">🧡</text>
            <view class="method-text">
              <text>储值卡支付</text>
              <text class="method-sub">余额 ¥{{ walletBalanceYuan }}</text>
            </view>
          </view>
          <view
            class="method"
            :class="{ active: payMethod === 'wechat' }"
            @tap="payMethod = 'wechat'"
          >
            <text class="method-icon">💚</text>
            <text>微信支付（演示）</text>
          </view>
        </view>

        <button
          v-if="phase !== 'paying'"
          class="btn"
          :class="{ wallet: payMethod === 'wallet' }"
          :loading="loading"
          :disabled="phase === 'paying' || (payMethod === 'wallet' && !walletCanPay)"
          @tap="confirmPay"
        >
          {{ payBtnLabel }}
        </button>
        <text v-if="payMethod === 'wallet' && !walletCanPay" class="wallet-hint">
          余额不足，请前往「我的 → 储值卡」充值
        </text>
      </template>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { payOrder } from '../../api/family';
import { pbGet } from '../../api/pb';
import { fetchFamilyWallet, payFamilyOrderWithWallet } from '../../api/wallet';
import { guardPackageRoute } from '../../utils/nav-guard';
import { pbErrorMessage } from '../../utils/request';

const orderId = ref('');
const amountCents = ref(0);
const elderName = ref('');
const serviceName = ref('');
const scheduledAt = ref('');
const loading = ref(false);
const phase = ref<'idle' | 'confirming' | 'paying' | 'success'>('idle');
const payMethod = ref<'wallet' | 'wechat'>('wallet');
const walletBalanceCents = ref(0);

const walletBalanceYuan = computed(() => (walletBalanceCents.value / 100).toFixed(2));
const walletCanPay = computed(() => walletBalanceCents.value >= amountCents.value);
const payBtnLabel = computed(() => {
  const amt = (amountCents.value / 100).toFixed(2);
  if (phase.value === 'idle') {
    return payMethod.value === 'wallet' ? `储值卡支付 ¥${amt}` : `确认支付 ¥${amt}`;
  }
  return payMethod.value === 'wallet' ? '储值卡支付' : '微信支付';
});

async function loadWallet() {
  try {
    const w = await fetchFamilyWallet();
    walletBalanceCents.value = w.balanceCents;
    if (walletCanPay.value) payMethod.value = 'wallet';
    else payMethod.value = 'wechat';
  } catch {
    payMethod.value = 'wechat';
  }
}

onShow(() => {
  if (!guardPackageRoute('/package-family/order/pay')) return;
  loadWallet();
});

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
    return new Date(iso).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function confirmPay() {
  if (phase.value === 'idle') {
    phase.value = 'confirming';
    const amt = (amountCents.value / 100).toFixed(2);
    const content =
      payMethod.value === 'wallet'
        ? `使用储值卡支付 ¥${amt}？（演示，从余额扣减）`
        : `使用微信支付 ¥${amt}？（演示，不产生真实扣款）`;
    uni.showModal({
      title: '确认支付',
      content,
      success: (res) => {
        if (res.confirm) pay();
        else phase.value = 'idle';
      },
    });
    return;
  }
  pay();
}

async function pay() {
  if (!orderId.value) return;
  phase.value = 'paying';
  loading.value = true;
  try {
    if (payMethod.value === 'wallet') {
      await payFamilyOrderWithWallet(orderId.value);
    } else {
      await new Promise((r) => setTimeout(r, 1500));
      await payOrder(orderId.value);
    }
    phase.value = 'success';
  } catch (e) {
    phase.value = 'idle';
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goOrders() {
  uni.redirectTo({ url: '/package-family/order/list' });
}
</script>

<style scoped>
.page {
  padding: 48rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.hint {
  color: #999;
  text-align: center;
}
.card {
  padding: 32rpx;
  background: #fff;
  border-radius: 16rpx;
}
.badge {
  display: inline-block;
  padding: 4rpx 16rpx;
  font-size: 22rpx;
  color: #c45c26;
  background: #ffe8d9;
  border-radius: 8rpx;
}
.svc {
  display: block;
  margin-top: 20rpx;
  font-size: 36rpx;
  font-weight: 600;
}
.elder,
.meta {
  display: block;
  margin-top: 12rpx;
  color: #666;
  font-size: 28rpx;
}
.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 32rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}
.amount-label {
  font-size: 28rpx;
  color: #666;
}
.price {
  font-size: 40rpx;
  color: #c45c26;
  font-weight: 600;
}
.pay-methods {
  margin-top: 32rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 8rpx 0;
}
.method {
  display: flex;
  align-items: center;
  padding: 24rpx;
  font-size: 28rpx;
}
.method.active {
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  border-radius: 12rpx;
}
.method-icon {
  margin-right: 16rpx;
  font-size: 32rpx;
}
.method-text {
  display: flex;
  flex-direction: column;
}
.method-sub {
  font-size: 22rpx;
  color: #888;
  margin-top: 4rpx;
}
.btn {
  margin-top: 48rpx;
  background: #07c160;
  color: #fff;
  border-radius: 12rpx;
}
.btn.wallet {
  background: var(--nb-primary, #c45c26);
}
.wallet-hint {
  display: block;
  margin-top: 16rpx;
  text-align: center;
  font-size: 24rpx;
  color: #999;
}
.wx-pay-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.wx-pay-box {
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx 64rpx;
  text-align: center;
}
.wx-logo {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #07c160;
}
.wx-spinner {
  width: 64rpx;
  height: 64rpx;
  margin: 32rpx auto;
  border: 4rpx solid #e0e0e0;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.wx-hint {
  font-size: 26rpx;
  color: #888;
}
.success-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 64rpx 32rpx;
  text-align: center;
}
.success-icon {
  display: block;
  width: 96rpx;
  height: 96rpx;
  line-height: 96rpx;
  margin: 0 auto;
  font-size: 48rpx;
  color: #fff;
  background: #07c160;
  border-radius: 50%;
}
.success-title {
  display: block;
  margin-top: 32rpx;
  font-size: 40rpx;
  font-weight: 600;
}
.success-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #888;
}
</style>

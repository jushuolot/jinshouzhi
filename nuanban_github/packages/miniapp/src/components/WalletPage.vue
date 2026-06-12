<template>
  <view class="page nb-page" :class="{ 'elder-mode': role === 'elder', [elderFontCls]: role === 'elder' }">
    <view class="hero nb-hero">
      <text class="hero-label">储值余额</text>
      <text class="hero-balance">¥{{ balanceYuan }}</text>
      <text class="hero-sub">预存金额，确认服务时一键抵扣</text>
    </view>

    <view class="topup-card nb-card">
      <text class="section-title">快捷充值</text>
      <view class="chips">
        <view
          v-for="amt in presetAmounts"
          :key="amt"
          class="chip"
          :class="{ active: selectedCents === amt * 100 }"
          @tap="selectPreset(amt)"
        >
          ¥{{ amt }}
        </view>
      </view>
      <view class="custom-row">
        <text class="custom-label">自定义</text>
        <input
          class="custom-input"
          type="digit"
          :value="customYuan"
          placeholder="输入金额"
          @input="onCustomInput"
        />
        <text class="custom-unit">元</text>
      </view>
      <button class="btn-topup nb-btn-primary" :loading="topping" @tap="doTopup">立即充值</button>
      <text class="topup-hint">演示环境，点击即充值成功，不产生真实扣款</text>
    </view>

    <view v-if="isDemo" class="security-note nb-card">
      <text class="security-icon">🔐</text>
      <text class="security-text">
        测试版余额存于浏览器 localStorage（演示明文）；正式版在服务端 PocketBase，经 HTTPS 传输。
      </text>
    </view>

    <text class="section nb-section-title">最近记录</text>
    <view v-if="loading" class="empty nb-card">加载中…</view>
    <view v-else-if="!transactions.length" class="empty nb-card">暂无记录，充值后即可用于支付</view>
    <view v-for="tx in transactions" :key="tx.id" class="record nb-card">
      <view class="record-main">
        <text class="record-label">{{ tx.label }}</text>
        <text class="record-meta">{{ formatTime(tx.createdAt) }} · {{ tx.type === 'topup' ? '充值' : '消费' }}</text>
      </view>
      <text class="record-amount" :class="tx.type">
        {{ tx.type === 'topup' ? '+' : '-' }}¥{{ (tx.amountCents / 100).toFixed(2) }}
      </text>
    </view>

    <RoleTabBar v-if="role" :role="role" :current="profileTab" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from './RoleTabBar.vue';
import {
  fetchElderWallet,
  fetchFamilyWallet,
  topupElderWallet,
  topupFamilyWallet,
  type WalletTransaction,
} from '../api/wallet';
import { elderFontClass } from '../utils/elder-accessibility';
import { isDemoMockEnabled } from '../utils/demo-mock';
import { guardPackageRoute } from '../utils/nav-guard';
import { ensureElderPaymentReady } from '../utils/elder-payment-guard';
import { pbErrorMessage } from '../utils/request';
import type { RoleKey } from '../config/tabs';

const props = defineProps<{ role: 'family' | 'elder' }>();

const presetAmounts = [50, 100, 200, 500];
const loading = ref(false);
const topping = ref(false);
const balanceCents = ref(0);
const transactions = ref<WalletTransaction[]>([]);
const selectedCents = ref(10000);
const customYuan = ref('');
const elderFontCls = ref(elderFontClass());
const isDemo = isDemoMockEnabled();

const balanceYuan = computed(() => (balanceCents.value / 100).toFixed(2));
const profileTab = computed(() =>
  props.role === 'family' ? '/package-family/profile' : '/package-elder/profile',
);
const walletPath = computed(() =>
  props.role === 'family' ? '/package-family/wallet/index' : '/package-elder/wallet/index',
);

function selectPreset(yuan: number) {
  selectedCents.value = yuan * 100;
  customYuan.value = String(yuan);
}

function onCustomInput(e: { detail: { value: string } }) {
  const raw = e.detail.value.replace(/[^\d.]/g, '');
  customYuan.value = raw;
  const yuan = parseFloat(raw);
  if (Number.isFinite(yuan) && yuan > 0) {
    selectedCents.value = Math.round(yuan * 100);
  }
}

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

async function reload() {
  loading.value = true;
  try {
    const data =
      props.role === 'family' ? await fetchFamilyWallet() : await fetchElderWallet();
    balanceCents.value = data.balanceCents;
    transactions.value = data.transactions ?? [];
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function doTopup() {
  const cents = selectedCents.value;
  if (!cents || cents < 100) {
    uni.showToast({ title: '请输入至少 ¥1', icon: 'none' });
    return;
  }
  if (props.role === 'elder') {
    const ok = await ensureElderPaymentReady('储值卡充值');
    if (!ok) return;
  }
  topping.value = true;
  try {
    const data =
      props.role === 'family'
        ? await topupFamilyWallet(cents)
        : await topupElderWallet(cents);
    balanceCents.value = data.balanceCents;
    transactions.value = data.transactions ?? [];
    uni.showToast({ title: '充值成功', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    topping.value = false;
  }
}

onShow(() => {
  if (props.role === 'elder') elderFontCls.value = elderFontClass();
  if (!guardPackageRoute(walletPath.value)) return;
  reload();
});
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 48rpx 32rpx;
  margin-bottom: 24rpx;
}
.hero-label {
  display: block;
  font-size: 26rpx;
  color: var(--nb-text-muted, #a89488);
}
.hero-balance {
  display: block;
  margin-top: 12rpx;
  font-size: 72rpx;
  font-weight: 700;
  color: var(--nb-primary, #c45c26);
}
.hero-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--nb-text-secondary, #6b5748);
}
.topup-card {
  margin-bottom: 32rpx;
}
.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.chip {
  flex: 1;
  min-width: 140rpx;
  text-align: center;
  padding: 20rpx 0;
  border-radius: var(--nb-radius-sm, 12rpx);
  background: var(--nb-surface-muted, #faf7f4);
  border: 2rpx solid var(--nb-border, #f0e6dc);
  font-size: 30rpx;
  font-weight: 600;
  color: var(--nb-text, #3d2a1f);
}
.chip.active {
  background: var(--nb-primary-soft, #fff5ef);
  border-color: var(--nb-primary, #c45c26);
  color: var(--nb-primary, #c45c26);
}
.custom-row {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding: 16rpx 20rpx;
  background: var(--nb-surface-muted, #faf7f4);
  border-radius: var(--nb-radius-sm, 12rpx);
}
.custom-label {
  font-size: 28rpx;
  color: var(--nb-text-secondary, #6b5748);
  margin-right: 16rpx;
}
.custom-input {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
}
.custom-unit {
  font-size: 28rpx;
  color: var(--nb-text-muted, #a89488);
  margin-left: 8rpx;
}
.btn-topup {
  width: 100%;
  margin-top: 8rpx;
}
.topup-hint {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #a89488);
  text-align: center;
}
.security-note {
  display: flex;
  gap: 12rpx;
  align-items: flex-start;
  margin-bottom: 24rpx;
  padding: 20rpx 24rpx;
  background: var(--nb-peach, #fff8f2);
  border: 2rpx solid var(--nb-border-dashed, #f0e0d4);
}
.security-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}
.security-text {
  flex: 1;
  font-size: 22rpx;
  color: var(--nb-text-secondary, #6b5748);
  line-height: 1.55;
}
.empty {
  text-align: center;
  color: var(--nb-text-muted, #a89488);
  padding: 32rpx;
}
.record {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.record-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
}
.record-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #a89488);
}
.record-amount {
  font-size: 30rpx;
  font-weight: 600;
}
.record-amount.topup {
  color: var(--nb-primary, #c45c26);
}
.record-amount.pay {
  color: #333;
}
.elder-large .hero-balance {
  font-size: 88rpx;
}
.elder-large .chip {
  font-size: 36rpx;
  padding: 28rpx 0;
}
.elder-large .record-label {
  font-size: 34rpx;
}
</style>

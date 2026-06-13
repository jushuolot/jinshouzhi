<template>
  <view class="page nb-page">
    <view v-if="!paymentReady" class="gate nb-card">
      <text class="gate-title">请先绑定收款账户</text>
      <text class="gate-desc">
        收益暂存运营平台。提现前需绑定微信/银行卡/支付宝收款账户，审核通过后自动打款。
      </text>
      <button class="btn-bind nb-btn-primary" @tap="goPayment">去绑定收款账户</button>
    </view>

    <template v-else>
    <view class="hero nb-hero">
      <text class="hero-label">可提现余额</text>
      <text class="hero-balance">¥{{ availableYuan }}</text>
      <text class="hero-sub">收益暂存运营平台 · 待结算 ¥{{ frozenYuan }}</text>
    </view>

    <view class="channel-card nb-card">
      <text class="section-title">提现到</text>
      <view
        class="channel-item"
        :class="{ active: channel === 'wechat' }"
        @tap="channel = 'wechat'"
      >
        <text class="channel-name">微信零钱</text>
        <text class="channel-meta">{{ overview?.boundWechat || '未绑定' }}</text>
      </view>
      <view
        class="channel-item"
        :class="{ active: channel === 'bank' }"
        @tap="channel = 'bank'"
      >
        <text class="channel-name">银行卡</text>
        <text class="channel-meta">{{ overview?.boundBank || '未绑定' }}</text>
      </view>
    </view>

    <view class="amount-card nb-card">
      <text class="section-title">提现金额</text>
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
        <view class="chip all" :class="{ active: isAllSelected }" @tap="selectAll">全部提现</view>
      </view>
      <view class="custom-row">
        <text class="custom-label">自定义</text>
        <input
          class="custom-input"
          type="digit"
          :value="customYuan"
          placeholder="最低 ¥10"
          @input="onCustomInput"
        />
        <text class="custom-unit">元</text>
      </view>
      <button class="btn-withdraw nb-btn-primary" :loading="submitting" @tap="doWithdraw">
        确认提现
      </button>
      <text v-if="isDemoMock" class="hint">演示环境，微信即时到账；银行卡 1–3 工作日（mock）</text>
    </view>

    <text class="section nb-section-title">提现记录</text>
    <view v-if="loading" class="empty nb-card">加载中…</view>
    <view v-else-if="!overview?.withdrawals?.length" class="empty nb-card">暂无提现记录</view>
    <view v-for="w in overview?.withdrawals ?? []" :key="w.id" class="record nb-card">
      <view class="record-main">
        <text class="record-label">{{ w.channelLabel }}</text>
        <text class="record-meta">
          {{ formatTime(w.createdAt) }} · {{ statusLabel(w.status) }}
        </text>
      </view>
      <text class="record-amount">-¥{{ (w.amountCents / 100).toFixed(2) }}</text>
    </view>
    </template>

    <RoleTabBar role="student" current="/package-student/profile" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import {
  fetchStudentWithdrawal,
  submitStudentWithdrawal,
  type StudentWithdrawalOverview,
  type WithdrawalChannel,
} from '../../api/student';
import { fetchPaymentAccount } from '../../api/payment-account';
import { guardPackageRoute } from '../../utils/nav-guard';
import { isDemoMockEnabled } from '../../utils/demo-mock';
import { pbErrorMessage } from '../../utils/request';

const isDemoMock = isDemoMockEnabled();

const presetAmounts = [50, 100, 200];
const loading = ref(false);
const submitting = ref(false);
const paymentReady = ref(false);
const overview = ref<StudentWithdrawalOverview | null>(null);
const channel = ref<WithdrawalChannel>('wechat');
const selectedCents = ref(5000);
const customYuan = ref('50');

const availableYuan = computed(() => overview.value?.availableYuan ?? '0.00');
const frozenYuan = computed(() => overview.value?.frozenYuan ?? '0.00');
const isAllSelected = computed(() => {
  const avail = overview.value?.availableCents ?? 0;
  return avail > 0 && selectedCents.value === avail;
});

function selectPreset(yuan: number) {
  selectedCents.value = yuan * 100;
  customYuan.value = String(yuan);
}

function selectAll() {
  const avail = overview.value?.availableCents ?? 0;
  if (avail < 1000) {
    uni.showToast({ title: '可提现余额不足 ¥10', icon: 'none' });
    return;
  }
  selectedCents.value = avail;
  customYuan.value = (avail / 100).toFixed(2);
}

function onCustomInput(e: { detail: { value: string } }) {
  const raw = e.detail.value.replace(/[^\d.]/g, '');
  customYuan.value = raw;
  const yuan = parseFloat(raw);
  if (Number.isFinite(yuan) && yuan > 0) {
    selectedCents.value = Math.round(yuan * 100);
  }
}

function statusLabel(status: string) {
  if (status === 'completed') return '已到账';
  if (status === 'rejected') return '已驳回';
  return '处理中';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    const [pay, wd] = await Promise.all([
      fetchPaymentAccount('student'),
      fetchStudentWithdrawal(),
    ]);
    paymentReady.value = pay.configured === true;
    overview.value = wd;
  } catch (e) {
    overview.value = null;
    paymentReady.value = false;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goPayment() {
  uni.navigateTo({ url: '/package-student/profile/payment' });
}

async function doWithdraw() {
  if (submitting.value) return;
  if (!paymentReady.value) {
    uni.showToast({ title: '请先绑定收款账户', icon: 'none' });
    return;
  }
  const cents = selectedCents.value;
  if (!Number.isFinite(cents) || cents < 1000) {
    uni.showToast({ title: '提现金额至少 ¥10', icon: 'none' });
    return;
  }
  if (cents > (overview.value?.availableCents ?? 0)) {
    uni.showToast({ title: '可提现余额不足', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    overview.value = await submitStudentWithdrawal(cents, channel.value);
    const msg =
      channel.value === 'wechat' ? '提现成功，已到账' : '已提交，预计 1–3 工作日到账';
    uni.showToast({ title: msg, icon: 'success' });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

onShow(() => {
  if (!guardPackageRoute('/package-student/withdrawal/index')) return;
  reload();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.gate {
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
}
.gate-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.gate-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 32rpx;
}
.btn-bind {
  width: 100%;
}
.hero {
  margin-bottom: 24rpx;
}
.hero-label {
  display: block;
  font-size: 26rpx;
  color: #888;
}
.hero-balance {
  display: block;
  margin-top: 12rpx;
  font-size: 56rpx;
  font-weight: 700;
  color: #c45c26;
}
.hero-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #aaa;
}
.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}
.channel-card,
.amount-card {
  margin-bottom: 24rpx;
}
.channel-item {
  padding: 24rpx;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}
.channel-item.active {
  border-color: #c45c26;
  background: #fff8f0;
}
.channel-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.channel-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #888;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.chip {
  padding: 16rpx 28rpx;
  background: #f5f5f5;
  border-radius: 999rpx;
  font-size: 28rpx;
  border: 2rpx solid transparent;
}
.chip.active {
  background: #fff5ef;
  border-color: #c45c26;
  color: #c45c26;
}
.chip.all {
  font-size: 26rpx;
}
.custom-row {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.custom-label {
  font-size: 28rpx;
  margin-right: 16rpx;
}
.custom-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}
.custom-unit {
  margin-left: 12rpx;
  font-size: 28rpx;
  color: #888;
}
.btn-withdraw {
  margin-bottom: 12rpx;
}
.hint {
  display: block;
  font-size: 22rpx;
  color: #bbb;
  text-align: center;
}
.section {
  display: block;
  margin-bottom: 16rpx;
}
.empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
  margin-bottom: 16rpx;
}
.record {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.record-main {
  flex: 1;
}
.record-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}
.record-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999;
}
.record-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
</style>

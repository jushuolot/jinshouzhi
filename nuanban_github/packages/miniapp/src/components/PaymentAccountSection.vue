<template>
  <view class="section-wrap">
    <text class="section">{{ sectionTitle }}</text>
    <view class="card">
      <view class="provider-row">
        <text class="provider-icon">💳</text>
        <view class="provider-info">
          <text class="provider-name">扫呗 Saobei</text>
          <text class="provider-desc">{{ providerDesc }}</text>
        </view>
        <text v-if="account?.configured" class="status-ok">已配置</text>
        <text v-else class="status-pending">待配置</text>
      </view>

      <template v-if="!account?.configured">
        <text class="field-label">商户号（演示）</text>
        <input
          v-model="merchantNo"
          class="input nb-input"
          placeholder="扫呗商户号，演示可填任意数字"
        />
        <text class="field-label">账户名称</text>
        <input
          v-model="accountName"
          class="input nb-input"
          :placeholder="namePlaceholder"
        />
        <button class="btn-bind" :loading="binding" @tap="bind">绑定扫呗账户</button>
      </template>

      <view v-else class="configured">
        <text class="configured-label">{{ account.accountLabel || '扫呗账户已绑定' }}</text>
        <text class="configured-hint">正式版将对接扫呗 API 完成实名与分账</text>
        <button class="btn-rebind" size="mini" @tap="resetBind">重新绑定</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { RoleKey } from '../config/tabs';
import {
  bindPaymentAccount,
  fetchPaymentAccount,
  type PaymentAccount,
} from '../api/payment-account';
import { pbErrorMessage } from '../utils/request';

const props = defineProps<{
  role: RoleKey;
}>();

const emit = defineEmits<{
  change: [configured: boolean];
}>();

const account = ref<PaymentAccount | null>(null);
const merchantNo = ref('');
const accountName = ref('');
const binding = ref(false);

const sectionTitle = computed(() =>
  props.role === 'student' ? '收款账户（扫呗预留）' : '付款/收款账户（扫呗预留）',
);

const providerDesc = computed(() =>
  props.role === 'student'
    ? '服务结算与提现收款通道'
    : '储值卡充值与服务订单付款通道',
);

const namePlaceholder = computed(() =>
  props.role === 'student' ? '如：林同学' : props.role === 'family' ? '如：张女士' : '如：张奶奶',
);

async function load() {
  try {
    account.value = await fetchPaymentAccount(props.role);
    emit('change', account.value.configured);
  } catch {
    account.value = { provider: 'saobei', configured: false };
    emit('change', false);
  }
}

watch(
  () => props.role,
  () => void load(),
);

onMounted(() => void load());

function resetBind() {
  account.value = { provider: 'saobei', configured: false };
  merchantNo.value = '';
  accountName.value = '';
  emit('change', false);
}

async function bind() {
  const no = merchantNo.value.trim();
  const name = accountName.value.trim();
  if (!no || !name) {
    uni.showToast({ title: '请填写商户号与账户名称', icon: 'none' });
    return;
  }
  binding.value = true;
  try {
    account.value = await bindPaymentAccount(props.role, {
      provider: 'saobei',
      merchantNo: no,
      accountName: name,
    });
    emit('change', true);
    uni.showToast({ title: '扫呗账户已绑定', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    binding.value = false;
  }
}

defineExpose({
  isConfigured: () => account.value?.configured === true,
  reload: load,
});
</script>

<style scoped>
.section-wrap {
  margin-top: 8rpx;
}
.section {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin: 24rpx 0 12rpx;
  color: var(--nb-text, #333);
}
.card {
  background: var(--nb-surface, #fff);
  border-radius: var(--nb-radius-sm, 12rpx);
  padding: 24rpx;
  border: 2rpx solid var(--nb-border, #eee);
}
.provider-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.provider-icon {
  font-size: 40rpx;
}
.provider-info {
  flex: 1;
}
.provider-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}
.provider-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #999);
}
.status-ok {
  font-size: 22rpx;
  color: #2e7d32;
  background: #e8f5e9;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.status-pending {
  font-size: 22rpx;
  color: var(--nb-primary, #c45c26);
  background: #fff5ef;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.field-label {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-secondary, #666);
  margin: 16rpx 0 8rpx;
}
.input {
  background: var(--nb-surface-muted, #f9f9f9);
  padding: 20rpx 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
}
.btn-bind {
  margin-top: 20rpx;
  background: var(--nb-primary, #c45c26);
  color: #fff;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
}
.configured {
  padding-top: 8rpx;
}
.configured-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: var(--nb-text, #333);
}
.configured-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #999);
}
.btn-rebind {
  margin-top: 16rpx;
  margin-left: 0;
  color: var(--nb-primary, #c45c26);
  background: #fff;
  border: 2rpx solid var(--nb-border, #eee);
}
</style>

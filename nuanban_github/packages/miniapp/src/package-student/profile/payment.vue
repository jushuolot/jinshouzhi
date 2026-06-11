<template>
  <view class="page">
    <text class="lead">收益暂存运营平台。提现前需绑定收款账户，审核通过后自动打款。</text>
    <PaymentAccountSection ref="paymentRef" role="student" @change="onPaymentChange" />
    <view class="channels">
      <text class="channels-title">支持到账方式</text>
      <text class="channels-item">· 微信零钱</text>
      <text class="channels-item">· 银行卡</text>
      <text class="channels-item">· 支付宝</text>
    </view>
    <button class="btn" @tap="goBack">完成</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PaymentAccountSection from '../../components/PaymentAccountSection.vue';

const paymentRef = ref<InstanceType<typeof PaymentAccountSection> | null>(null);
const configured = ref(false);

function onPaymentChange(ok: boolean) {
  configured.value = ok;
}

function goBack() {
  if (configured.value) {
    uni.showToast({ title: '收款账户已保存', icon: 'success' });
  }
  setTimeout(() => uni.navigateBack(), 300);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--nb-page-bg, #f5f5f5);
  padding: 24rpx;
}
.lead {
  display: block;
  margin-bottom: 20rpx;
  font-size: 26rpx;
  color: var(--nb-text-muted, #666);
  line-height: 1.5;
}
.channels {
  margin-top: 24rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 12rpx;
}
.channels-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.channels-item {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}
.btn {
  margin-top: 32rpx;
  background: var(--nb-primary, #c45c26);
  color: #fff;
  border-radius: 12rpx;
}
</style>

<template>
  <view class="page">
    <text class="title">家属端</text>
    <view class="card" @tap="goPay">待支付订单</view>
    <RoleTabBar role="family" current="/package-family/home" />
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import { guardPackageRoute } from '../utils/nav-guard';

onShow(() => guardPackageRoute('/package-family/home'));

function goPay() {
  uni.navigateTo({ url: '/package-family/order/pay' });
}
</script>

<style scoped>
.page {
  padding: 32rpx;
  padding-bottom: 120rpx;
}
.card {
  background: #fff;
  padding: 32rpx;
  border-radius: 12rpx;
  margin-top: 24rpx;
}
</style>

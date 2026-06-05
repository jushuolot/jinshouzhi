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
import { listBoundElders, listPendingPaymentOrders } from '../api/family';
import { useRoleStore } from '../store/role';
import { guardPackageRoute } from '../utils/nav-guard';
import { pbErrorMessage } from '../utils/request';

const roleStore = useRoleStore();

onShow(() => guardPackageRoute('/package-family/home'));

async function goPay() {
  if (!roleStore.user?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  try {
    const bindings = await listBoundElders(roleStore.user.id);
    const elderIds = bindings.map((b) => b.elder).filter(Boolean);
    const orders = await listPendingPaymentOrders(elderIds);
    if (!orders.length) {
      uni.showToast({ title: '暂无待支付订单', icon: 'none' });
      return;
    }
    uni.navigateTo({ url: `/package-family/order/pay?id=${orders[0].id}` });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
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

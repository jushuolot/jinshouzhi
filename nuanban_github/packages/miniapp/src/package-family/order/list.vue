<template>
  <view class="page">
    <text class="tip">待支付订单</text>
    <view v-for="o in list" :key="o.id" class="card" @tap="openPay(o.id)">
      <text>订单 {{ o.id.slice(0, 8) }}</text>
      <text class="meta">¥{{ ((o.amount_cents || 0) / 100).toFixed(0) }}</text>
    </view>
    <view v-if="!loading && !list.length" class="empty">暂无待支付订单</view>
    <RoleTabBar role="family" current="/package-family/order/list" />
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import RoleTabBar from '../../components/RoleTabBar.vue';
import { listBoundElders, listPendingPaymentOrders } from '../../api/family';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';
import type { PbRecord } from '../../api/pb';

const list = ref<(PbRecord & { amount_cents?: number })[]>([]);
const loading = ref(false);
const roleStore = useRoleStore();

async function reload() {
  if (!roleStore.user?.id) return;
  loading.value = true;
  try {
    const bindings = await listBoundElders(roleStore.user.id);
    const elderIds = bindings.map((b) => b.elder).filter(Boolean);
    list.value = await listPendingPaymentOrders(elderIds);
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(reload);

function openPay(id: string) {
  uni.navigateTo({ url: `/package-family/order/pay?id=${id}` });
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.tip {
  color: #666;
  font-size: 26rpx;
}
.card {
  background: #fff;
  padding: 24rpx;
  margin-top: 16rpx;
  border-radius: 8rpx;
}
.meta {
  display: block;
  color: #666;
  margin-top: 8rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
</style>

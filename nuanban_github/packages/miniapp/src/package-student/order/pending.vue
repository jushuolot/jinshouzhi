<template>
  <view class="page">
    <text class="tip">待接单列表</text>
    <view v-for="o in list" :key="o.id" class="card" @tap="open(o.id)">
      <text>订单 {{ o.id.slice(0, 8) }}</text>
      <text class="meta">老人 {{ o.elderId?.slice(0, 6) }} · ¥{{ ((o.amountCents || 0) / 100).toFixed(0) }}</text>
    </view>
    <view v-if="!loading && !list.length" class="empty">暂无待接单</view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { listPendingOrders, type PendingOrder } from '../../api/student';
import { pbErrorMessage } from '../../utils/request';

const list = ref<PendingOrder[]>([]);
const loading = ref(false);

async function reload() {
  loading.value = true;
  try {
    list.value = await listPendingOrders();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(reload);

function open(id: string) {
  uni.navigateTo({ url: `/package-student/order/request?id=${id}` });
}
</script>

<style scoped>
.page {
  padding: 24rpx;
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
  font-size: 26rpx;
  margin-top: 8rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
</style>

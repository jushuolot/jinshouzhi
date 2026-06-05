<template>
  <view class="page">
    <text class="title">机构派单（演示）</text>
    <text class="sub">将待接单订单指定给学生，零成本 Mock，无需 Admin 后台</text>
    <ListCountBar :count="list.length" hint="pending_accept 全局池" />
    <view v-for="o in list" :key="o.id" class="card">
      <text class="svc">{{ o.serviceName }}</text>
      <text class="meta">{{ o.elderName }} · ¥{{ ((o.amountCents || 0) / 100).toFixed(0) }}</text>
      <button class="btn-sm" size="mini" :loading="dispatching === o.id" @tap="dispatch(o.id)">
        派给林同学
      </button>
    </view>
    <view v-if="!loading && !list.length" class="empty">暂无待派单</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ListCountBar from '../../components/ListCountBar.vue';
import { dispatchOrder, listDispatchableOrders, type DispatchOrderItem } from '../../api/org';
import { pbErrorMessage } from '../../utils/request';

const list = ref<DispatchOrderItem[]>([]);
const loading = ref(false);
const dispatching = ref('');

async function reload() {
  loading.value = true;
  try {
    list.value = await listDispatchableOrders();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(reload);

async function dispatch(id: string) {
  dispatching.value = id;
  try {
    await dispatchOrder(id);
    uni.showToast({ title: '已派单', icon: 'success' });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    dispatching.value = '';
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 20rpx;
  font-size: 24rpx;
  color: #888;
}
.card {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}
.svc {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.meta {
  display: block;
  margin: 8rpx 0 16rpx;
  font-size: 24rpx;
  color: #888;
}
.btn-sm {
  background: #c45c26;
  color: #fff;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>

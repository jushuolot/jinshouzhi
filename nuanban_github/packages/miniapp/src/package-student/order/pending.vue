<template>
  <view class="page">
    <view class="header">
      <view class="header-top">
        <view>
          <text class="title">待接单</text>
          <text class="subtitle">机构派单与老人预约，先到先得</text>
        </view>
      </view>
    </view>

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!list.length" class="empty">
      <text class="empty-icon">📭</text>
      <text>暂无待接单</text>
      <text class="empty-hint">有新订单时会出现在这里</text>
    </view>
    <scroll-view v-else scroll-y class="order-scroll">
      <ListCountBar :count="list.length" hint="富数据演示 · 可滚动压测" />
      <view v-for="o in list" :key="o.id" class="order-card" @tap="open(o.id)">
        <view class="order-head">
          <text class="svc-name">{{ o.serviceName || '陪护服务' }}</text>
          <text class="price">¥{{ ((o.amountCents || 0) / 100).toFixed(0) }}</text>
        </view>
        <view class="order-row">
          <text class="label">服务老人</text>
          <text class="value">{{ o.elderName || '老人' }}</text>
        </view>
        <view class="order-row">
          <text class="label">预约时间</text>
          <text class="value">{{ formatTime(o.scheduledAt) }}</text>
        </view>
        <view v-if="o.durationMinutes" class="order-row">
          <text class="label">服务时长</text>
          <text class="value">{{ o.durationMinutes }} 分钟</text>
        </view>
        <view class="order-foot">
          <text class="status-tag">待接单</text>
          <text class="cta">立即接单 ›</text>
        </view>
      </view>
    </scroll-view>

    <RoleTabBar role="student" current="/package-student/order/pending" />
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import RoleTabBar from '../../components/RoleTabBar.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import { listPendingOrders, type PendingOrder } from '../../api/student';
import { guardPackageRoute } from '../../utils/nav-guard';
import { pbErrorMessage } from '../../utils/request';

const list = ref<PendingOrder[]>([]);
const loading = ref(false);

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

onShow(() => {
  if (!guardPackageRoute('/package-student/order/pending')) return;
  reload();
});

function open(id: string) {
  uni.navigateTo({ url: `/package-student/order/request?id=${id}` });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.header {
  margin-bottom: 24rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}
.subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}
.order-scroll {
  max-height: calc(100vh - 280rpx);
}
.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}
.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.svc-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
.price {
  font-size: 32rpx;
  font-weight: 600;
  color: #c45c26;
}
.order-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  font-size: 26rpx;
}
.label {
  color: #999;
}
.value {
  color: #333;
}
.order-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}
.status-tag {
  padding: 4rpx 16rpx;
  font-size: 22rpx;
  color: #c45c26;
  background: #fff5ef;
  border-radius: 20rpx;
}
.cta {
  font-size: 26rpx;
  color: #c45c26;
  font-weight: 600;
}
.state,
.empty {
  text-align: center;
  padding: 80rpx 32rpx;
  color: #999;
}
.empty-icon {
  display: block;
  font-size: 64rpx;
  margin-bottom: 16rpx;
}
.empty-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #bbb;
}
</style>

<template>
  <view class="page elder-mode" :class="fontClass">
    <text class="tip">我的服务订单</text>
    <view v-if="!orders.length" class="empty">暂无订单</view>
    <scroll-view v-else scroll-y class="order-scroll">
      <ListCountBar :count="orders.length" hint="我的服务 · 可滚动" />
      <view v-for="o in orders" :key="o.id" class="card" @tap="goDetail(o.id)">
        <view class="head">
          <text class="svc">{{ serviceName(o) }}</text>
          <text class="status">{{ statusLabel(o.status) }}</text>
        </view>
        <text class="meta">{{ formatTime(o.scheduled_at) }} · ¥{{ ((o.amount_cents || 0) / 100).toFixed(0) }}</text>
      </view>
    </scroll-view>
    <RoleTabBar role="elder" current="/package-elder/order/list" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import { listOrdersForElder, type OrderRow } from '../../api/elder';
import { useRoleStore } from '../../store/role';
import { guardPackageRoute } from '../../utils/nav-guard';
import { elderFontClass } from '../../utils/elder-accessibility';
import { orderStatusLabel } from '../../utils/order-status';

const orders = ref<
  (OrderRow & { expand?: { service_item?: { name: string } } })[]
>([]);
const roleStore = useRoleStore();
const fontClass = computed(() => elderFontClass());

function serviceName(o: (typeof orders.value)[0]) {
  return o.expand?.service_item?.name || '陪护服务';
}

function statusLabel(s: string) {
  return orderStatusLabel(s);
}

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onShow(async () => {
  if (!guardPackageRoute('/package-elder/order/list')) return;
  const elderId = roleStore.currentElderId;
  if (!elderId) return;
  orders.value = await listOrdersForElder(elderId);
});

function goDetail(id: string) {
  uni.navigateTo({ url: `/package-elder/order/detail?id=${id}` });
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  padding-bottom: 120rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.tip {
  color: #666;
  font-size: 26rpx;
}
.order-scroll {
  max-height: calc(100vh - 280rpx);
}
.card {
  background: #fff;
  padding: 28rpx 24rpx;
  margin-top: 16rpx;
  border-radius: 12rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.svc {
  font-size: 32rpx;
  font-weight: 600;
}
.status {
  font-size: 22rpx;
  color: #c45c26;
  background: #fff5ef;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.meta {
  display: block;
  margin-top: 10rpx;
  color: #888;
  font-size: 24rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
.page.elder-large .svc {
  font-size: 40rpx;
}
.page.elder-large .meta {
  font-size: 32rpx;
}
</style>

<template>
  <view class="page">
    <text class="tip">待服务 / 服务中的订单</text>
    <ListSearchBar v-model="searchKeyword" placeholder="搜索老人、服务、订单号…" />
    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!shown.length" class="empty">
      {{ searchKeyword ? '无匹配订单' : '暂无进行中订单' }}
    </view>
    <scroll-view v-else scroll-y class="order-scroll">
      <ListCountBar :count="shown.length" hint="服务中 · 可搜索" />
      <view v-for="o in shown" :key="o.id" class="card" @tap="open(o.id)">
        <view class="card-head">
          <text class="svc">{{ o.serviceName || '陪护服务' }}</text>
          <text class="status-tag" :class="o.status">{{ statusLabel(o.status) }}</text>
        </view>
        <text class="elder">服务老人 · {{ o.elderName || '—' }}</text>
        <text class="meta">{{ formatTime(o.scheduledAt) }} · ¥{{ ((o.amountCents || 0) / 100).toFixed(0) }}</text>
      </view>
    </scroll-view>
    <RoleTabBar role="student" current="/package-student/order/active" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import { listActiveOrders, type PendingOrder } from '../../api/student';
import { guardPackageRoute } from '../../utils/nav-guard';
import { orderStatusLabel } from '../../utils/order-status';
import { pbErrorMessage } from '../../utils/request';

const list = ref<PendingOrder[]>([]);
const searchKeyword = ref('');
const loading = ref(false);

const shown = computed(() =>
  list.value.filter((o) =>
    matchListKeyword(searchKeyword.value, [
      o.id,
      o.elderName,
      o.serviceName,
      o.status,
      o.amountCents,
    ]),
  ),
);

function statusLabel(s: string) {
  return orderStatusLabel(s);
}

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    list.value = await listActiveOrders();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!guardPackageRoute('/package-student/order/active')) return;
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
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.svc {
  font-size: 32rpx;
  font-weight: 600;
}
.status-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #fff5ef;
  color: #c45c26;
}
.status-tag.in_service {
  background: #e8f5e9;
  color: #2e7d32;
}
.elder {
  display: block;
  margin-top: 12rpx;
  color: #666;
  font-size: 26rpx;
}
.meta {
  display: block;
  margin-top: 8rpx;
  color: #999;
  font-size: 24rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
</style>

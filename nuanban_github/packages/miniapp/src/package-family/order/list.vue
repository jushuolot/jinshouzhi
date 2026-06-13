<template>
  <view class="page">
    <view class="segmented">
      <view class="seg-item" :class="{ active: tab === 'pay' }" @tap="tab = 'pay'">待支付</view>
      <view class="seg-item" :class="{ active: tab === 'confirm' }" @tap="tab = 'confirm'">待确认</view>
      <view class="seg-item" :class="{ active: tab === 'all' }" @tap="tab = 'all'">全部</view>
    </view>

    <ListSearchBar v-model="searchKeyword" placeholder="搜索服务、老人、订单号…" />

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!filtered.length" class="empty">
      {{ searchKeyword ? '无匹配订单' : '暂无订单' }}
    </view>
    <scroll-view v-else scroll-y class="order-scroll">
      <ListCountBar
        :count="filtered.length"
        :hint="
          tab === 'pay'
            ? '待支付 · 可滚动'
            : tab === 'confirm'
              ? '待确认服务 · 可滚动'
              : '全部订单 · 可滚动压测'
        "
      />
      <view v-for="o in filtered" :key="o.id" class="card" @tap="onTap(o)">
        <view class="head">
          <text class="svc">{{ o.expand?.service_item?.name || '陪护服务' }}</text>
          <view class="badges">
            <text v-if="o.payment_status === 'unpaid'" class="pay-badge">待付</text>
            <text class="status">{{ statusLabel(o.status) }}</text>
          </view>
        </view>
        <text class="elder">{{ o.expand?.elder?.name || '老人' }}</text>
        <text class="meta">
          ¥{{ ((o.amount_cents || 0) / 100).toFixed(0) }}
          <text v-if="o.scheduled_at"> · {{ formatTime(o.scheduled_at) }}</text>
        </text>
      </view>
    </scroll-view>
    <RoleTabBar role="family" current="/package-family/order/list" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import ListSearchBar from '../../components/ListSearchBar.vue';
import { matchListKeyword } from '../../utils/list-search';
import { listBoundElders, listPendingConfirmOrders, listPendingPaymentOrders } from '../../api/family';
import { pbList, type PbRecord } from '../../api/pb';
import { useRoleStore } from '../../store/role';
import { guardPackageRoute } from '../../utils/nav-guard';
import { orderStatusLabel } from '../../utils/order-status';
import { pbErrorMessage } from '../../utils/request';

type OrderItem = PbRecord & {
  status: string;
  amount_cents?: number;
  scheduled_at?: string;
  payment_status?: string;
  expand?: {
    elder?: { name: string };
    service_item?: { name: string };
  };
};

const tab = ref<'pay' | 'confirm' | 'all'>('pay');
const searchKeyword = ref('');
const payList = ref<OrderItem[]>([]);
const confirmList = ref<OrderItem[]>([]);
const allList = ref<OrderItem[]>([]);
const loading = ref(false);
const roleStore = useRoleStore();

const shown = computed(() => {
  if (tab.value === 'pay') return payList.value;
  if (tab.value === 'confirm') return confirmList.value;
  return allList.value;
});

const filtered = computed(() =>
  shown.value.filter((o) =>
    matchListKeyword(searchKeyword.value, [
      o.id,
      o.status,
      o.expand?.elder?.name,
      o.expand?.service_item?.name,
      o.amount_cents,
    ]),
  ),
);

function statusLabel(s: string) {
  return orderStatusLabel(s);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  if (!roleStore.user?.id) return;
  loading.value = true;
  try {
    const bindings = await listBoundElders(roleStore.user.id);
    const elderIds = bindings.map((b) => b.elder).filter(Boolean);
    payList.value = await listPendingPaymentOrders(elderIds);
    confirmList.value = await listPendingConfirmOrders(elderIds);
    if (!elderIds.length) {
      allList.value = [];
      return;
    }
    const filter = elderIds.map((id) => `elder = "${id}"`).join(' || ');
    const res = await pbList<OrderItem>('orders', {
      filter: `(${filter})`,
      expand: 'elder,service_item',
      sort: '-created',
      perPage: 30,
    });
    allList.value = res.items;
  } catch (e) {
    payList.value = [];
    confirmList.value = [];
    allList.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!guardPackageRoute('/package-family/order/list')) return;
  reload();
});

function onTap(o: OrderItem) {
  uni.navigateTo({ url: `/package-family/order/detail?id=${o.id}` });
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  padding-bottom: 120rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.segmented {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}
.seg-item {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  color: #666;
}
.seg-item.active {
  color: #c45c26;
  font-weight: 600;
  background: #fffaf5;
}
.order-scroll {
  max-height: calc(100vh - 320rpx);
}
.state {
  text-align: center;
  color: #999;
  padding: 80rpx 32rpx;
}
.card {
  background: #fff;
  padding: 28rpx 24rpx;
  margin-bottom: 12rpx;
  border-radius: 12rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.svc {
  font-size: 30rpx;
  font-weight: 600;
}
.badges {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.pay-badge {
  font-size: 20rpx;
  color: #fff;
  background: #e65100;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
.status {
  font-size: 22rpx;
  color: #c45c26;
}
.elder {
  display: block;
  margin-top: 8rpx;
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

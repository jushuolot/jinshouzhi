<template>
  <view class="page nb-page">
    <text class="title">机构派单</text>
    <text class="sub">{{ subTitle }}</text>
    <ListSearchBar v-model="searchKeyword" placeholder="搜索老人、服务、订单号…" />
    <ListCountBar :count="shown.length" hint="pending_accept 全局池" />
    <view v-for="o in shown" :key="o.id" class="card">
      <text class="svc">{{ o.serviceName }}</text>
      <text v-if="o.requiresOutdoorApproval" class="outdoor-tag">外出陪同</text>
      <text class="meta">{{ o.elderName }} · ¥{{ ((o.amountCents || 0) / 100).toFixed(0) }}</text>
      <button class="btn-sm" size="mini" :loading="dispatching === o.id" @tap="dispatch(o.id)">
        派给林同学
      </button>
    </view>
    <view v-if="!loading && !shown.length" class="empty">
      {{ searchKeyword ? '无匹配订单' : '暂无待派单' }}
    </view>

    <OpsTabBar current="/pages/common/org-dispatch" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ListCountBar from '../../components/ListCountBar.vue';
import ListSearchBar from '../../components/ListSearchBar.vue';
import { matchListKeyword } from '../../utils/list-search';
import OpsTabBar from '../../components/OpsTabBar.vue';
import { dispatchOrder, listDispatchableOrders, type DispatchOrderItem } from '../../api/org';
import { requireOpsSession } from '../../utils/ops-mode';
import { isDemoMockEnabled } from '../../utils/demo-mock';
import { pbErrorMessage } from '../../utils/request';

const subTitle = isDemoMockEnabled()
  ? '将待接单指定给学生 · 浏览器 Mock（GitHub Pages）'
  : '将待接单指定给学生 · PocketBase 测试数据';

const list = ref<DispatchOrderItem[]>([]);
const searchKeyword = ref('');
const loading = ref(false);
const dispatching = ref('');

const shown = computed(() =>
  list.value.filter((o) =>
    matchListKeyword(searchKeyword.value, [o.id, o.elderName, o.serviceName, o.amountCents]),
  ),
);

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

onShow(() => {
  if (!requireOpsSession()) return;
  void reload();
});

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
  background: var(--nb-page-bg, #f5f5f5);
  padding: 24rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
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
.outdoor-tag {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8a6d3b;
  background: #fff8e6;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
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

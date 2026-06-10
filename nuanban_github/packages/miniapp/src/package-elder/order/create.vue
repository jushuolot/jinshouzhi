<template>
  <view class="page elder-mode">
    <view class="header">
      <text class="title">预约服务</text>
      <text class="sub">选择服务 SKU，明码标价</text>
    </view>

    <view v-if="loadingList" class="state">加载中…</view>

    <scroll-view v-else scroll-y class="list">
      <view v-for="group in groups" :key="group.name" class="group">
        <text class="group-title">{{ group.name }}</text>
        <view
          v-for="item in group.items"
          :key="item.id"
          class="card"
          :class="{ selected: selectedId === item.id }"
          @tap="selectedId = item.id"
        >
          <view class="card-main">
            <text class="name">{{ item.name }}</text>
            <text class="meta">{{ item.duration }} 分钟 · ¥{{ item.priceYuan }}</text>
            <text v-if="item.outdoor" class="tag">需家属审批外出</text>
          </view>
          <text class="check">{{ selectedId === item.id ? '✓' : '' }}</text>
        </view>
      </view>
      <view v-if="!groups.length" class="state">暂无可预约服务</view>
    </scroll-view>

    <button class="btn-primary" :loading="loading" :disabled="!selectedId" @tap="submit">
      提交预约
    </button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { createOrder, listServiceItems, resolveElderIdForApi } from '../../api/elder';
import { pbErrorMessage } from '../../utils/request';

const studentUserId = ref('');
const rows = ref<
  {
    id: string;
    name: string;
    price_cents: number;
    duration_minutes?: number;
    requires_outdoor_approval?: boolean;
    categoryName: string;
  }[]
>([]);
const selectedId = ref('');
const loadingList = ref(true);
const loading = ref(false);

const groups = computed(() => {
  const map = new Map<string, { name: string; duration: number; priceYuan: string; outdoor: boolean; id: string }[]>();
  for (const r of rows.value) {
    const cat = r.categoryName || '其他服务';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push({
      id: r.id,
      name: r.name,
      duration: r.duration_minutes || 60,
      priceYuan: ((r.price_cents || 0) / 100).toFixed(0),
      outdoor: !!r.requires_outdoor_approval,
    });
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
});

onLoad(async (q) => {
  studentUserId.value = (q?.studentUserId as string) || '';
  try {
    const list = await listServiceItems();
    rows.value = list.map((r) => ({
      id: r.id,
      name: r.name,
      price_cents: r.price_cents,
      duration_minutes: r.duration_minutes,
      requires_outdoor_approval: r.requires_outdoor_approval,
      categoryName: r.expand?.category?.name || '其他服务',
    }));
    if (rows.value.length) selectedId.value = rows.value[0].id;
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loadingList.value = false;
  }
});

async function submit() {
  const elderId = await resolveElderIdForApi();
  if (!elderId) {
    uni.showToast({ title: '未绑定老人档案', icon: 'none' });
    return;
  }
  if (!selectedId.value) {
    uni.showToast({ title: '请选择服务', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const res = await createOrder({
      elderId,
      serviceItemId: selectedId.value,
      studentId: studentUserId.value || undefined,
      scheduledAt: new Date().toISOString(),
    });
    uni.showToast({ title: '已提交', icon: 'success' });
    uni.navigateTo({ url: `/package-elder/order/detail?id=${res.id}` });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.header {
  padding: 32rpx 32rpx 16rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #888;
}
.list {
  max-height: calc(100vh - 280rpx);
  padding: 0 24rpx 24rpx;
}
.group {
  margin-bottom: 24rpx;
}
.group-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #c45c26;
  margin: 16rpx 8rpx 12rpx;
}
.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
}
.card.selected {
  border-color: #c45c26;
  background: #fff8f3;
}
.card-main {
  flex: 1;
}
.name {
  display: block;
  font-size: 30rpx;
  color: #333;
}
.meta {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #666;
}
.tag {
  display: inline-block;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
  color: #c45c26;
  background: #ffe8d9;
  border-radius: 8rpx;
}
.check {
  font-size: 36rpx;
  color: #c45c26;
  margin-left: 16rpx;
}
.state {
  padding: 48rpx;
  text-align: center;
  color: #888;
}
.btn-primary {
  margin: 24rpx 32rpx 48rpx;
  background: #c45c26;
  color: #fff;
}
.btn-primary[disabled] {
  opacity: 0.5;
}
</style>

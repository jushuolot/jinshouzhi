<template>
  <view class="page nb-page elder-mode">
    <view class="header">
      <text class="title">预约服务</text>
      <text class="sub">选择服务 SKU，明码标价</text>
      <text v-if="studentUserId" class="student-hint">已指定陪护同学</text>
    </view>

    <view v-if="loadingList" class="state">加载中…</view>

    <scroll-view v-else scroll-y class="list">
      <view v-for="group in groups" :key="group.name" class="group">
        <text class="group-title">{{ group.name }}</text>
        <view
          v-for="item in group.items"
          :key="item.id"
          class="card nb-card"
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
      <view v-if="!groups.length" class="empty nb-card">
        <text class="empty-icon">🛎️</text>
        <text class="empty-title">暂无可预约服务</text>
        <text class="empty-desc">运营请在「机构 → 服务目录」上架 SKU 并启用</text>
        <text class="empty-hint">本地正式版可运行 seed-demo 注入默认服务项</text>
      </view>
    </scroll-view>

    <button class="btn-primary nb-btn-primary" :loading="loading" :disabled="!selectedId" @tap="submit">
      提交预约
    </button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { createOrder, listServiceItems, resolveElderIdForApi } from '../../api/elder';
import { pbErrorMessage } from '../../utils/request';

import { readRouteQuery } from '../../utils/route-query';

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
  studentUserId.value = readRouteQuery(q, 'studentUserId');
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
  padding: 8rpx 8rpx 16rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--nb-text-muted);
}
.student-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #2e7d32;
}
.list {
  max-height: calc(100vh - 280rpx);
  padding: 0 8rpx 24rpx;
}
.group {
  margin-bottom: 24rpx;
}
.group-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--nb-primary);
  margin: 16rpx 8rpx 12rpx;
}
.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
}
.card.selected {
  border-color: var(--nb-primary);
  background: var(--nb-primary-soft);
}
.card-main {
  flex: 1;
}
.name {
  display: block;
  font-size: 30rpx;
  color: var(--nb-text);
}
.meta {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
}
.tag {
  display: inline-block;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
  color: var(--nb-primary);
  background: var(--nb-primary-soft);
  border-radius: 8rpx;
}
.check {
  font-size: 36rpx;
  color: var(--nb-primary);
  margin-left: 16rpx;
}
.state {
  padding: 48rpx;
  text-align: center;
  color: var(--nb-text-muted);
}
.empty {
  text-align: center;
  padding: 48rpx 32rpx;
}
.empty-icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 12rpx;
}
.empty-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.empty-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
  line-height: 1.5;
}
.empty-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.btn-primary {
  margin: 24rpx 8rpx 48rpx;
}
.btn-primary[disabled] {
  opacity: 0.5;
}
</style>

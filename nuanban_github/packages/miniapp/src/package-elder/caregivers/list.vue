<template>
  <view class="page elder-mode">
    <view class="header">
      <text class="title">找陪护</text>
      <text class="subtitle">按距离推荐附近大学生志愿者</text>
    </view>
    <view v-if="loading" class="state">加载中…</view>
    <ListCountBar v-if="!loading && list.length" :count="list.length" hint="6 位同学 · 列表演示" />
    <PersonCard
      v-for="item in list"
      :key="item.id"
      :name="item.name"
      :subtitle="caregiverSubtitle(item)"
      :tags="item.tags"
      :rating="item.rating"
      :distance="item.distance"
      :extra="item.orderCount ? `服务 ${item.orderCount} 次` : undefined"
      cta-text="预约"
      @tap="goDetail(item)"
    />
    <view v-if="!loading && !list.length" class="empty">暂无附近陪护，请稍后再试</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PersonCard from '../../components/PersonCard.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import { getNearbyCaregivers, type CaregiverItem } from '../../api/elder';
import { getLocationWithFallback } from '../../utils/location';

const list = ref<CaregiverItem[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const loc = await getLocationWithFallback(3000);
    list.value = await getNearbyCaregivers(loc.lat, loc.lng);
    if (loc.isDemo && !list.value.length) {
      uni.showToast({ title: '使用演示定位', icon: 'none' });
    }
  } catch {
    list.value = await getNearbyCaregivers(31.2304, 121.4737);
  } finally {
    loading.value = false;
  }
});

function caregiverSubtitle(item: CaregiverItem) {
  const parts = [item.gender, item.school].filter(Boolean);
  return parts.join(' · ');
}

function goDetail(item: CaregiverItem) {
  const id = item.id || item.userId || '';
  uni.navigateTo({ url: `/package-elder/caregivers/detail?id=${id}` });
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  margin-bottom: 24rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #888;
}
.state {
  text-align: center;
  color: #999;
  padding: 32rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
</style>

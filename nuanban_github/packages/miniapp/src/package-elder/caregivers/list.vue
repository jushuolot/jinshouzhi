<template>
  <view class="page elder-mode">
    <view class="header">
      <text class="title">找陪护</text>
      <text class="subtitle">按距离为您推荐附近同学</text>
    </view>
    <view v-if="loading" class="state">加载中…</view>
    <PersonCard
      v-for="item in list"
      :key="item.id"
      :name="item.name"
      :subtitle="item.school"
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

function goDetail(item: CaregiverItem) {
  const q = [
    `studentUserId=${item.userId || ''}`,
    `name=${encodeURIComponent(item.name || '')}`,
    `school=${encodeURIComponent(item.school || '')}`,
    `distance=${encodeURIComponent(item.distance || '')}`,
    `rating=${item.rating ?? ''}`,
    `orderCount=${item.orderCount ?? ''}`,
    `intro=${encodeURIComponent(item.intro || '')}`,
    `tags=${encodeURIComponent((item.tags || []).join(','))}`,
  ].join('&');
  uni.navigateTo({ url: `/package-elder/caregivers/detail?${q}` });
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

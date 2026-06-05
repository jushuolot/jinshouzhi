<template>
  <view class="page elder-mode">
    <text class="tip">按距离为您推荐附近同学</text>
    <view v-if="loading" class="state">加载中…</view>
    <view v-for="item in list" :key="item.id" class="card" @tap="goDetail(item)">
      <text class="name">{{ item.name }}</text>
      <text class="meta">{{ item.distance }} · {{ item.school }}</text>
    </view>
    <view v-if="!loading && !list.length" class="empty">暂无附近陪护，请稍后再试</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
  const studentUserId = item.userId || '';
  const q = [
    `studentUserId=${studentUserId}`,
    `name=${encodeURIComponent(item.name || '')}`,
    `school=${encodeURIComponent(item.school || '')}`,
    `distance=${encodeURIComponent(item.distance || '')}`,
  ].join('&');
  uni.navigateTo({ url: `/package-elder/caregivers/detail?${q}` });
}
</script>

<style scoped>
.page {
  padding: 24rpx;
}
.state {
  text-align: center;
  color: #999;
  padding: 32rpx;
}
.card {
  background: #fff;
  padding: 28rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
}
.name {
  font-size: 36rpx;
  font-weight: 600;
}
.meta {
  color: #666;
  font-size: 28rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
</style>

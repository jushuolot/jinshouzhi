<template>
  <view class="page elder-mode">
    <view class="header">
      <text class="title">找陪护</text>
      <text class="subtitle">按距离推荐附近大学生志愿者</text>
    </view>
    <ListSearchBar v-model="searchKeyword" placeholder="搜索同学姓名、学校…" />
    <view v-if="loading" class="state">加载中…</view>
    <ListCountBar v-if="!loading && shown.length" :count="shown.length" hint="附近同学 · 可搜索" />
    <PersonCard
      v-for="item in shown"
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
    <view v-if="!loading && !shown.length" class="empty">
      {{ searchKeyword ? '无匹配同学' : '暂无附近陪护，请稍后再试' }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import PersonCard from '../../components/PersonCard.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import ListSearchBar from '../../components/ListSearchBar.vue';
import { getNearbyCaregivers, type CaregiverItem } from '../../api/elder';
import { matchListKeyword } from '../../utils/list-search';
import { getLocationWithFallback } from '../../utils/location';

const list = ref<CaregiverItem[]>([]);
const searchKeyword = ref('');
const loading = ref(true);

const shown = computed(() =>
  list.value.filter((item) =>
    matchListKeyword(searchKeyword.value, [
      item.name,
      item.school,
      item.gender,
      item.distance,
      ...(item.tags || []),
    ]),
  ),
);

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

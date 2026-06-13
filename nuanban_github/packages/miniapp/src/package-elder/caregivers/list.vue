<template>
  <view class="page elder-mode">
    <view class="header">
      <text class="title">找陪护</text>
      <text class="subtitle">
        共 {{ allList.length }} 位可接单同学
        <text v-if="locationLabel"> · {{ locationLabel }}</text>
      </text>
    </view>

    <ListSearchBar v-model="searchKeyword" placeholder="搜索同学姓名、学校、服务…" />

    <view class="filter-section">
      <text class="filter-label">距离</text>
      <view class="filter-row">
        <view
          v-for="d in distanceFilters"
          :key="d.key"
          class="filter-chip"
          :class="{ active: distanceFilter === d.key }"
          @tap="distanceFilter = d.key"
        >
          {{ d.label }}
        </view>
      </view>
    </view>

    <view class="filter-section">
      <text class="filter-label">性别</text>
      <view class="filter-row">
        <view
          v-for="g in genderFilters"
          :key="g.key"
          class="filter-chip"
          :class="{ active: genderFilter === g.key }"
          @tap="genderFilter = g.key"
        >
          {{ g.label }}
        </view>
      </view>
    </view>

    <view v-if="schoolOptions.length > 1" class="filter-section">
      <text class="filter-label">学校</text>
      <view class="filter-row">
        <view
          v-for="s in schoolOptions"
          :key="s"
          class="filter-chip"
          :class="{ active: schoolFilter === s }"
          @tap="schoolFilter = s"
        >
          {{ s }}
        </view>
      </view>
    </view>

    <view v-if="loading" class="state">加载中…</view>
    <ListCountBar
      v-else-if="shown.length"
      :count="shown.length"
      :hint="countHint"
    />
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
      {{ emptyText }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import PersonCard from '../../components/PersonCard.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import ListSearchBar from '../../components/ListSearchBar.vue';
import { listCaregivers, type CaregiverItem } from '../../api/elder';
import { matchListKeyword } from '../../utils/list-search';
import { getLocationWithFallback } from '../../utils/location';
import { guardPackageRoute } from '../../utils/nav-guard';
import { pbErrorMessage } from '../../utils/request';

const distanceFilters = [
  { key: 'all', label: '全部' },
  { key: '3', label: '3km内' },
  { key: '5', label: '5km内' },
  { key: '10', label: '10km内' },
] as const;

const genderFilters = [
  { key: 'all', label: '全部' },
  { key: '女', label: '女生' },
  { key: '男', label: '男生' },
] as const;

type DistanceKey = (typeof distanceFilters)[number]['key'];
type GenderKey = (typeof genderFilters)[number]['key'];

const allList = ref<CaregiverItem[]>([]);
const searchKeyword = ref('');
const distanceFilter = ref<DistanceKey>('all');
const genderFilter = ref<GenderKey>('all');
const schoolFilter = ref('全部');
const loading = ref(true);
const locationLabel = ref('');

const schoolOptions = computed(() => {
  const schools = new Set<string>();
  for (const item of allList.value) {
    if (item.school) schools.add(item.school);
  }
  return ['全部', ...Array.from(schools).sort((a, b) => a.localeCompare(b, 'zh'))];
});

const shown = computed(() =>
  allList.value.filter((item) => {
    if (distanceFilter.value !== 'all') {
      const limit = Number(distanceFilter.value);
      if (item.distanceKm == null || item.distanceKm > limit) return false;
    }
    if (genderFilter.value !== 'all' && item.gender !== genderFilter.value) return false;
    if (schoolFilter.value !== '全部' && item.school !== schoolFilter.value) return false;
    return matchListKeyword(searchKeyword.value, [
      item.name,
      item.school,
      item.gender,
      item.distance,
      ...(item.tags || []),
      item.intro,
    ]);
  }),
);

const countHint = computed(() => {
  const filtered =
    distanceFilter.value !== 'all'
    || genderFilter.value !== 'all'
    || schoolFilter.value !== '全部'
    || searchKeyword.value.trim();
  return filtered ? '筛选结果' : '全部可接单同学';
});

const emptyText = computed(() => {
  if (searchKeyword.value.trim()) return '无匹配同学，试试放宽筛选条件';
  if (distanceFilter.value !== 'all' || genderFilter.value !== 'all' || schoolFilter.value !== '全部') {
    return '当前条件下暂无同学，可切换「全部」距离';
  }
  return '暂无可接单同学，请稍后再试';
});

async function loadAll() {
  loading.value = true;
  try {
    const loc = await getLocationWithFallback(3000);
    locationLabel.value = loc.label;
    const res = await listCaregivers({ lat: loc.lat, lng: loc.lng });
    allList.value = res.list ?? [];
    if (loc.isDemo && !allList.value.length) {
      uni.showToast({ title: '使用演示定位', icon: 'none' });
    }
  } catch (e) {
    allList.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!guardPackageRoute('/package-elder/caregivers/list')) return;
  void loadAll();
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
  margin-bottom: 20rpx;
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
.filter-section {
  margin-bottom: 16rpx;
}
.filter-label {
  display: block;
  margin-bottom: 8rpx;
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.filter-chip {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  background: #fff;
  color: #666;
  border: 1rpx solid #e8e0d6;
}
.filter-chip.active {
  background: #fff5ef;
  color: #c45c26;
  border-color: #e8c4a8;
  font-weight: 600;
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
  font-size: 26rpx;
  line-height: 1.6;
  padding: 0 24rpx;
}
</style>

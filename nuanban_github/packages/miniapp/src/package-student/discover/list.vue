<template>
  <view class="page">
    <view class="header">
      <view class="header-top">
        <view>
          <text class="title">附近老人</text>
          <text class="subtitle">我的位置：{{ locationLabel }} · 5km 内</text>
        </view>
        <text class="back-home" @tap="goHome">返回首页</text>
      </view>
    </view>

    <view class="segmented">
      <view class="seg-item" :class="{ active: mode === 'list' }" @tap="mode = 'list'">
        <text>列表</text>
      </view>
      <view class="seg-item" :class="{ active: mode === 'map' }" @tap="mode = 'map'">
        <text>地图</text>
      </view>
    </view>

    <view v-if="loading" class="state">加载中…</view>

    <!-- 列表模式 -->
    <view v-else-if="mode === 'list'">
      <ListCountBar :count="list.length" hint="8 位老人 · 双机构" />
      <PersonCard
        v-for="e in list"
        :key="e.id"
        :name="e.name"
        :subtitle="e.orgName"
        :tags="e.tags"
        :distance="formatDistance(e.distanceKm)"
        cta-text="详情"
        @tap="openElder(e)"
      />

      <view v-if="errorMsg" class="error" @tap="reload">
        <text>加载失败（点此重试）</text>
        <text class="mono">{{ errorMsg }}</text>
      </view>
      <view v-else-if="!list.length" class="empty">
        <text>暂无附近老人</text>
        <text class="empty-hint">请先执行 ./scripts/seed-demo.sh</text>
      </view>
    </view>

    <!-- 地图模式 -->
    <view v-else class="map-wrap">
      <map
        class="discover-map"
        :latitude="userLat"
        :longitude="userLng"
        :scale="14"
        :markers="markers"
        :show-location="true"
        enable-zoom
        enable-scroll
        @markertap="onMarkerTap"
        @callouttap="onCalloutTap"
      />
      <view class="map-toolbar">
        <text class="map-hint">{{ isDemoLocation ? '演示定位（上海）' : '已定位到当前位置' }}</text>
        <text class="relocate" @tap="reload">重新定位</text>
      </view>
      <view v-if="list.length" class="map-legend">
        <text class="dot self">●</text><text class="legend-text">我的位置</text>
        <text class="dot elder">●</text><text class="legend-text">附近老人 {{ list.length }} 位</text>
      </view>
      <view v-else-if="!errorMsg" class="empty map-empty">附近暂无老人标注</view>
    </view>

    <RoleTabBar role="student" current="/package-student/discover/list" />
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import RoleTabBar from '../../components/RoleTabBar.vue';
import PersonCard from '../../components/PersonCard.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import { listNearbyElders, type ElderRow } from '../../api/student';
import { getLocationWithFallback } from '../../utils/location';
import { pbErrorMessage } from '../../utils/request';

type ElderListItem = ElderRow & { distanceKm: number; orgName: string; tags?: string[] };

const DEMO = { lat: 31.2304, lng: 121.4737, label: '演示定位（上海）' };

const mode = ref<'list' | 'map'>('list');
const list = ref<ElderListItem[]>([]);
const loading = ref(false);
const errorMsg = ref('');
const userLat = ref(DEMO.lat);
const userLng = ref(DEMO.lng);
const locationLabel = ref(DEMO.label);
const isDemoLocation = ref(true);

const markers = computed(() => {
  const items: UniApp.MapMarker[] = [
    {
      id: 0,
      latitude: userLat.value,
      longitude: userLng.value,
      title: '我的位置',
      width: 24,
      height: 24,
      callout: {
        content: '我的位置',
        display: 'BYCLICK',
        padding: 8,
        borderRadius: 6,
      },
    },
  ];
  list.value.forEach((e, idx) => {
    const lat = e.latitude as number | undefined;
    const lng = e.longitude as number | undefined;
    if (!lat || !lng) return;
    items.push({
      id: idx + 1,
      latitude: lat,
      longitude: lng,
      title: e.name,
      width: 28,
      height: 28,
      callout: {
        content: `${e.name} · ${formatDistance(e.distanceKm)}`,
        display: 'BYCLICK',
        padding: 8,
        borderRadius: 6,
      },
    });
  });
  return items;
});

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

async function resolveLocation() {
  const loc = await getLocationWithFallback(3000);
  userLat.value = loc.lat;
  userLng.value = loc.lng;
  locationLabel.value = loc.label;
  isDemoLocation.value = loc.isDemo;
  if (loc.isDemo) {
    uni.showToast({ title: '使用演示定位', icon: 'none' });
  }
}

async function reload() {
  loading.value = true;
  errorMsg.value = '';
  try {
    await resolveLocation();
    const rows = await listNearbyElders(userLat.value, userLng.value);
    list.value = rows.map((e) => ({
      ...e,
      orgName: e.expand?.org?.name || '暖伴示范养老院',
      tags: (e as { tags?: string[] }).tags,
    }));
  } catch (e) {
    list.value = [];
    errorMsg.value = pbErrorMessage(e);
  } finally {
    loading.value = false;
  }
}

onShow(reload);

function goHome() {
  uni.redirectTo({ url: '/package-student/home' });
}

function openElder(e: ElderListItem) {
  const q = [
    `id=${e.id}`,
    `name=${encodeURIComponent(e.name)}`,
    `distanceKm=${e.distanceKm.toFixed(1)}`,
    `orgName=${encodeURIComponent(e.orgName)}`,
  ].join('&');
  uni.navigateTo({ url: `/package-student/discover/elder?${q}` });
}

function onMarkerTap(e: { detail: { markerId: number } }) {
  const markerId = e.detail.markerId;
  if (markerId === 0) return;
  const elder = list.value[markerId - 1];
  if (elder) openElder(elder);
}

function onCalloutTap(e: { detail: { markerId: number } }) {
  onMarkerTap(e);
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  padding-bottom: 120rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  margin-bottom: 20rpx;
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}
.subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}
.back-home {
  font-size: 26rpx;
  color: #c45c26;
  padding: 8rpx 0;
}
.segmented {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.seg-item {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}
.seg-item.active {
  color: #c45c26;
  font-weight: 600;
}
.seg-item.active::after {
  content: '';
  position: absolute;
  left: 25%;
  right: 25%;
  bottom: 0;
  height: 4rpx;
  background: #c45c26;
  border-radius: 2rpx;
}
.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.card-main {
  flex: 1;
}
.name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
.org {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #888;
}
.badge {
  display: inline-block;
  margin-top: 12rpx;
  padding: 4rpx 16rpx;
  font-size: 22rpx;
  color: #c45c26;
  background: #fff5ef;
  border-radius: 20rpx;
}
.card-action {
  display: flex;
  align-items: center;
  margin-left: 16rpx;
}
.action-text {
  font-size: 24rpx;
  color: #999;
}
.chevron {
  margin-left: 4rpx;
  font-size: 36rpx;
  color: #ccc;
  line-height: 1;
}
.map-wrap {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.discover-map {
  width: 100%;
  height: 55vh;
  min-height: 360px;
}
.map-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  border-top: 1rpx solid #f0f0f0;
}
.map-hint {
  font-size: 24rpx;
  color: #888;
}
.relocate {
  font-size: 26rpx;
  color: #c45c26;
}
.map-legend {
  display: flex;
  align-items: center;
  padding: 0 24rpx 20rpx;
  font-size: 24rpx;
  color: #666;
}
.dot {
  margin-right: 8rpx;
  font-size: 20rpx;
}
.dot.self {
  color: #2196f3;
}
.dot.elder {
  color: #c45c26;
  margin-left: 24rpx;
}
.legend-text {
  margin-right: 8rpx;
}
.map-empty {
  padding: 24rpx;
}
.state {
  text-align: center;
  color: #999;
  padding: 48rpx 0;
}
.empty {
  text-align: center;
  padding: 80rpx 32rpx;
  color: #999;
}
.empty-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #bbb;
}
.error {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  background: #fff3f3;
  color: #b71c1c;
}
.mono {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  word-break: break-all;
}
</style>

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

    <view class="coop-bar">
      <text class="coop-label">学校合作 · {{ schoolName }}</text>
      <switch :checked="schoolCoopOnly" color="#c45c26" @change="onCoopToggle" />
    </view>

    <ListSearchBar v-if="mode === 'list'" v-model="searchKeyword" placeholder="搜索老人姓名、机构…" />

    <view v-if="loading" class="state">加载中…</view>

    <!-- 列表模式 -->
    <template v-else-if="mode === 'list'">
      <view v-if="errorMsg" class="error" @tap="reload">
        <text>加载失败（点此重试）</text>
        <text class="mono">{{ errorMsg }}</text>
      </view>
      <view v-else-if="!displayList.length" class="empty">
        <text>{{ searchKeyword ? '无匹配老人' : '暂无附近老人' }}</text>
        <text v-if="!searchKeyword" class="empty-hint">请先执行 ./scripts/seed-demo.sh</text>
      </view>
      <scroll-view v-else scroll-y class="discover-scroll">
        <ListCountBar
          :count="displayList.length"
          :hint="schoolCoopOnly ? '仅合作机构 · 可滚动' : '全部附近 · 可滚动'"
        />
        <PersonCard
          v-for="e in displayList"
          :key="e.id"
          :name="e.name"
          :subtitle="elderSubtitle(e)"
          :tags="e.tags"
          :distance="formatDistance(e.distanceKm)"
          cta-text="详情"
          @tap="openElder(e)"
        />
      </scroll-view>
    </template>

    <!-- 地图模式 -->
    <view v-else class="map-wrap">
      <!-- #ifdef H5 -->
      <OsmMap
        class="discover-map"
        :center-lat="userLat"
        :center-lng="userLng"
        :markers="osmMarkers"
        height="55vh"
        @markertap="onOsmMarkerTap"
      />
      <!-- #endif -->
      <!-- #ifndef H5 -->
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
      <!-- #endif -->
      <view class="map-toolbar">
        <text class="map-hint">{{ isDemoLocation ? '演示定位（上海）' : '已定位到当前位置' }}</text>
        <text class="relocate" @tap="reload">重新定位</text>
      </view>
      <view v-if="list.length" class="map-legend">
        <text class="dot self">●</text><text class="legend-text">我的位置</text>
        <text class="dot coop">●</text><text class="legend-text">合作机构</text>
        <text v-if="!schoolCoopOnly" class="dot other">●</text>
        <text v-if="!schoolCoopOnly" class="legend-text">非合作</text>
        <text class="legend-count">共 {{ list.length }} 位</text>
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
import ListSearchBar from '../../components/ListSearchBar.vue';
import { matchListKeyword } from '../../utils/list-search';
// #ifdef H5
import OsmMap from '../../components/OsmMap.vue';
// #endif
import { fetchStudentProfile, listNearbyElders, type ElderRow } from '../../api/student';
import { getLocationWithFallback } from '../../utils/location';
import { filterEldersBySchoolCoop, orgPartnersSchool } from '../../utils/school-coop';
import { guardPackageRoute } from '../../utils/nav-guard';
import { pbErrorMessage } from '../../utils/request';

type ElderListItem = ElderRow & {
  distanceKm: number;
  orgName: string;
  gender?: string;
  tags?: string[];
  isCoop: boolean;
};

function elderSubtitle(e: ElderListItem) {
  const parts = [e.gender, e.orgName].filter(Boolean);
  return parts.join(' · ');
}

const DEMO = { lat: 31.2304, lng: 121.4737, label: '演示定位（上海）' };

const mode = ref<'list' | 'map'>('list');
const list = ref<ElderListItem[]>([]);
const searchKeyword = ref('');
const loading = ref(false);

const displayList = computed(() =>
  list.value.filter((e) =>
    matchListKeyword(searchKeyword.value, [e.name, e.orgName, e.gender, ...(e.tags || []), e.id]),
  ),
);
const errorMsg = ref('');
const userLat = ref(DEMO.lat);
const userLng = ref(DEMO.lng);
const locationLabel = ref(DEMO.label);
const isDemoLocation = ref(true);
const schoolCoopOnly = ref(true);
const schoolName = ref('示范大学');

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
    const coopTag = e.isCoop ? '合作' : '非合作';
    const calloutText = schoolCoopOnly.value
      ? `${e.name} · ${formatDistance(e.distanceKm)}`
      : `${e.name} · ${coopTag} · ${formatDistance(e.distanceKm)}`;
    items.push({
      id: idx + 1,
      latitude: lat,
      longitude: lng,
      title: e.name,
      width: 28,
      height: 28,
      label: {
        content: e.name,
        color: e.isCoop ? '#c45c26' : '#888',
        fontSize: 11,
        bgColor: e.isCoop ? '#fff5ef' : '#f5f5f5',
        borderRadius: 4,
        padding: 4,
        textAlign: 'center',
      },
      callout: {
        content: calloutText,
        color: e.isCoop ? '#c45c26' : '#666',
        bgColor: e.isCoop ? '#fff5ef' : '#f5f5f5',
        borderColor: e.isCoop ? '#f0dcc8' : '#e0e0e0',
        borderWidth: 1,
        display: 'BYCLICK',
        padding: 8,
        borderRadius: 6,
      },
    });
  });
  return items;
});

const osmMarkers = computed(() =>
  list.value
    .filter((e) => e.latitude && e.longitude)
    .map((e, idx) => ({
      id: idx + 1,
      lat: e.latitude as number,
      lng: e.longitude as number,
      label: e.name,
      kind: (e.isCoop ? 'coop' : 'other') as 'coop' | 'other',
    })),
);

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
    const profile = await fetchStudentProfile().catch(() => null);
    if (profile?.schoolName) schoolName.value = profile.schoolName;
    let rows = await listNearbyElders(userLat.value, userLng.value);
    const mapped = rows.map((e) => {
      const orgId = (e.org as string) || e.expand?.org?.id || '';
      const isCoop = orgPartnersSchool(orgId, schoolName.value);
      return {
        ...e,
        orgName: e.expand?.org?.name || '暖伴示范养老院',
        tags: (e as { tags?: string[] }).tags,
        isCoop,
      };
    });
    list.value = schoolCoopOnly.value
      ? filterEldersBySchoolCoop(mapped, schoolName.value)
      : mapped;
  } catch (e) {
    list.value = [];
    errorMsg.value = pbErrorMessage(e);
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!guardPackageRoute('/package-student/discover/list')) return;
  reload();
});

function onCoopToggle(e: { detail: { value: boolean } }) {
  schoolCoopOnly.value = e.detail.value;
  reload();
}

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

function onOsmMarkerTap(markerId: number | string) {
  const id = Number(markerId);
  if (!id) return;
  const elder = list.value[id - 1];
  if (elder) openElder(elder);
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
.coop-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fffaf5;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid #f0dcc8;
}
.coop-label {
  font-size: 24rpx;
  color: #666;
}
.segmented {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
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
.dot.coop {
  color: #c45c26;
  margin-left: 24rpx;
}
.dot.other {
  color: #999;
  margin-left: 24rpx;
}
.legend-text {
  margin-right: 8rpx;
}
.legend-count {
  margin-left: auto;
  color: #999;
}
.discover-scroll {
  max-height: calc(100vh - 360rpx);
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

<template>
  <view class="area-map">
    <view v-if="!disabled" class="mode-tabs">
      <view
        class="mode-tab"
        :class="{ active: mapMode === 'mark' }"
        @tap="mapMode = 'mark'"
      >
        <text class="mode-icon">📍</text>
        <text>描点围区</text>
      </view>
      <view
        class="mode-tab"
        :class="{ active: mapMode === 'pan' }"
        @tap="mapMode = 'pan'"
      >
        <text class="mode-icon">🖐</text>
        <text>拖动地图</text>
      </view>
    </view>
    <text class="hint">{{ modeHint }}</text>

    <view class="map-shell">
      <view class="map-wrap">
        <view v-if="!ready" class="loading">地图加载中…</view>
        <div
          v-if="useAmapMode"
          ref="amapHostRef"
          class="amap-stage"
          :class="{ 'stage-hidden': !ready }"
        />
        <div
          v-else
          ref="stageRef"
          class="stage"
          :class="{ 'stage-hidden': !ready, 'stage-mark': mapMode === 'mark' }"
        >
          <view class="tiles">
            <img
              v-for="tile in tiles"
              :key="tile.key + '-' + tileProvider"
              class="tile"
              :src="tile.url"
              :style="{ left: tile.x + 'px', top: tile.y + 'px' }"
              referrerpolicy="no-referrer"
              alt=""
              @error="onTileError"
            />
          </view>
          <svg
            class="overlay"
            :width="stageW"
            :height="stageH"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              v-for="poly in finishedPolygons"
              :key="poly.id"
              :points="polyPoints(poly.ring)"
              fill="rgba(196,92,38,0.25)"
              stroke="#c45c26"
              stroke-width="2"
            />
            <polyline
              v-if="draftRing.length"
              :points="polyPoints(draftRing)"
              fill="none"
              stroke="#2e7d32"
              stroke-width="2"
              stroke-dasharray="6 4"
            />
            <circle
              v-if="userLocation"
              :cx="pointPx(userLocation).x"
              :cy="pointPx(userLocation).y"
              r="8"
              fill="#1e88e5"
              stroke="#fff"
              stroke-width="2"
            />
            <circle
              v-for="(pt, idx) in allVisiblePoints"
              :key="'pt-' + idx"
              :cx="pointPx(pt).x"
              :cy="pointPx(pt).y"
              r="6"
              fill="#c45c26"
              stroke="#fff"
              stroke-width="2"
            />
          </svg>
          <text class="attr">{{ attribution }}</text>
        </div>

        <view v-if="!disabled && ready" class="map-floats">
          <view class="zoom-stack">
            <view class="float-btn" @tap.stop="zoomIn">＋</view>
            <view class="float-btn" @tap.stop="zoomOut">－</view>
          </view>
          <view
            class="float-btn locate"
            :class="{ loading: locating }"
            @tap.stop="locateMe"
          >
            <text class="locate-icon">◎</text>
          </view>
        </view>

        <view v-if="mapMode === 'mark' && ready" class="mark-hint">
          当前区域 {{ draftRing.length }} 个锚点 · 至少 3 点可完成
        </view>
      </view>

      <view v-if="!disabled" class="action-row">
        <view class="action-chip" @tap="undoPoint">撤销锚点</view>
        <view class="action-chip primary" @tap="finishPolygon">完成区域</view>
        <view class="action-chip" @tap="startNewPolygon">新区域</view>
      </view>
    </view>

    <text v-if="locationLabel" class="loc-label">{{ locationLabel }}</text>
    <view v-if="modelValue.polygons.length" class="summary">
      <text v-for="(p, i) in modelValue.polygons" :key="p.id" class="poly-tag">
        {{ p.label || `区域${i + 1}` }}（{{ p.ring.length }}点）
      </text>
    </view>
    <text v-else-if="!disabled" class="warn">请至少完成一个服务区域</text>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  clampMapZoom,
  mapAttribution,
  nextMapTileProvider,
  panMapByPixels,
  pixelToLatLng,
  markerPixel,
  visibleOsmTiles,
  type MapTileProvider,
} from '../utils/geo-map';
import { createAmapMap } from '../utils/amap-h5';
import { useOfficialAmap } from '../utils/map-config';
import { getLocationWithFallback } from '../utils/location';
import { bindMapStageGestures, resolveMapStageElement, type MapGestureMode } from '../utils/map-stage-gesture';
import {
  emptyServiceAreaGeo,
  type ServiceAreaGeo,
  type ServiceAreaPolygon,
  type GeoPoint,
} from '../utils/service-area-geo';
import {
  defaultMapStageSize,
  isH5Dom,
  measureMapStageDom,
  queryMapStageSize,
} from '../utils/h5-dom';

const props = withDefaults(
  defineProps<{
    modelValue: ServiceAreaGeo;
    disabled?: boolean;
    centerLat?: number;
    centerLng?: number;
  }>(),
  {
    disabled: false,
    centerLat: 31.2304,
    centerLng: 121.4737,
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: ServiceAreaGeo] }>();

const ready = ref(false);
const stageW = ref(defaultMapStageSize().w);
const stageH = ref(defaultMapStageSize().h);
const viewCenterLat = ref(props.centerLat);
const viewCenterLng = ref(props.centerLng);
const viewZoom = ref(13);
const draftRing = ref<GeoPoint[]>([]);
const mapMode = ref<MapGestureMode>('mark');
const tileProvider = ref<MapTileProvider>('auto');
const amapFailed = ref(false);
const amapHostRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const locating = ref(false);
const locationLabel = ref('');
const userLocation = ref<GeoPoint | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userLocationMarker: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let amapMap: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let amapNs: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const amapOverlays: any[] = [];
let destroyAmap: (() => void) | null = null;
let unbindStageGestures: (() => void) | null = null;
let tileErrorSwitches = 0;

const useAmapMode = computed(() => isH5Dom() && useOfficialAmap() && !amapFailed.value);

const finishedPolygons = computed(() => props.modelValue.polygons);
const allVisiblePoints = computed(() => [
  ...finishedPolygons.value.flatMap((p) => p.ring),
  ...draftRing.value,
]);

const tiles = computed(() =>
  visibleOsmTiles(
    viewCenterLat.value,
    viewCenterLng.value,
    viewZoom.value,
    stageW.value,
    stageH.value,
    tileProvider.value,
  ),
);

const attribution = computed(() => mapAttribution(tileProvider.value));

const modeHint = computed(() => (
  mapMode.value === 'mark'
    ? '描点模式：直接点击地图添加锚点，至少 3 点围成区域'
    : '拖动模式：单指平移、双指缩放，完成后切回描点'
));

function resolveStageEl(): HTMLElement | null {
  return resolveMapStageElement(stageRef.value, '.area-map .stage');
}

function bindTileStageGestures() {
  unbindStageGestures?.();
  const el = resolveStageEl();
  if (!el || useAmapMode.value) return;
  unbindStageGestures = bindMapStageGestures(
    el,
    {
      onTap: (x, y) => {
        if (props.disabled || !ready.value || mapMode.value !== 'mark') return;
        addPoint(x, y);
      },
      onPan: (dx, dy) => {
        if (props.disabled || mapMode.value !== 'pan') return;
        panView(dx, dy);
      },
      onPinchZoom: (factor) => {
        if (props.disabled) return;
        const delta = factor > 1 ? 0.35 : -0.35;
        applyZoomDelta(delta);
      },
      onWheelZoom: (deltaY) => {
        if (props.disabled) return;
        applyZoomDelta(deltaY > 0 ? -0.6 : 0.6);
      },
    },
    () => mapMode.value,
  );
}

function panView(dx: number, dy: number) {
  const next = panMapByPixels(
    dx,
    dy,
    viewCenterLat.value,
    viewCenterLng.value,
    viewZoom.value,
  );
  viewCenterLat.value = next.lat;
  viewCenterLng.value = next.lng;
}

function applyZoomDelta(delta: number) {
  viewZoom.value = clampMapZoom(viewZoom.value + delta);
  if (amapMap) {
    amapMap.setZoom(viewZoom.value);
  }
}

function zoomIn() {
  applyZoomDelta(1);
}

function zoomOut() {
  applyZoomDelta(-1);
}

function syncUserLocationMarker() {
  if (!amapMap || !amapNs) return;
  if (userLocationMarker) {
    amapMap.remove(userLocationMarker);
    userLocationMarker = null;
  }
  if (!userLocation.value) return;
  userLocationMarker = new amapNs.CircleMarker({
    center: [userLocation.value.lng, userLocation.value.lat],
    radius: 8,
    fillColor: '#1e88e5',
    strokeColor: '#fff',
    strokeWeight: 2,
    zIndex: 120,
  });
  amapMap.add(userLocationMarker);
}

async function locateMe() {
  if (props.disabled || locating.value) return;
  locating.value = true;
  try {
    const loc = await getLocationWithFallback(10000);
    userLocation.value = { lat: loc.lat, lng: loc.lng };
    viewCenterLat.value = loc.lat;
    viewCenterLng.value = loc.lng;
    viewZoom.value = clampMapZoom(15);
    locationLabel.value = loc.isDemo
      ? `${loc.label}（演示）`
      : `已定位 ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
    if (amapMap) {
      amapMap.setZoomAndCenter(viewZoom.value, [loc.lng, loc.lat]);
      syncUserLocationMarker();
    }
    if (loc.isDemo) {
      uni.showToast({ title: '使用演示定位（上海）', icon: 'none' });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '定位失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    locating.value = false;
  }
}

function onTileError() {
  if (tileErrorSwitches > 4) return;
  tileErrorSwitches += 1;
  tileProvider.value = nextMapTileProvider(tileProvider.value);
}

function clearAmapOverlays() {
  if (!amapMap) return;
  for (const overlay of amapOverlays) {
    amapMap.remove(overlay);
  }
  amapOverlays.length = 0;
}

function syncAmapOverlays() {
  if (!amapMap || !amapNs) return;
  clearAmapOverlays();

  for (const poly of finishedPolygons.value) {
    const polygon = new amapNs.Polygon({
      path: poly.ring.map((p) => [p.lng, p.lat]),
      fillColor: 'rgba(196,92,38,0.25)',
      strokeColor: '#c45c26',
      strokeWeight: 2,
    });
    amapMap.add(polygon);
    amapOverlays.push(polygon);
  }

  if (draftRing.value.length >= 2) {
    const line = new amapNs.Polyline({
      path: draftRing.value.map((p) => [p.lng, p.lat]),
      strokeColor: '#2e7d32',
      strokeWeight: 2,
      strokeStyle: 'dashed',
    });
    amapMap.add(line);
    amapOverlays.push(line);
  }

  for (const pt of allVisiblePoints.value) {
    const dot = new amapNs.CircleMarker({
      center: [pt.lng, pt.lat],
      radius: 5,
      fillColor: '#c45c26',
      strokeColor: '#fff',
      strokeWeight: 1.5,
    });
    amapMap.add(dot);
    amapOverlays.push(dot);
  }
}

async function initAmapStage() {
  if (!useAmapMode.value || !amapHostRef.value) return;
  try {
    const { map, AMap, destroy } = await createAmapMap(
      amapHostRef.value,
      viewCenterLng.value,
      viewCenterLat.value,
      viewZoom.value,
    );
    amapMap = map;
    amapNs = AMap;
    destroyAmap = destroy;
    map.on('click', (e: { lnglat: { getLng: () => number; getLat: () => number } }) => {
      if (props.disabled || mapMode.value !== 'mark') return;
      draftRing.value = [...draftRing.value, { lat: e.lnglat.getLat(), lng: e.lnglat.getLng() }];
      syncAmapOverlays();
      notifyPointAdded();
    });
    ready.value = true;
    syncAmapOverlays();
    if (!props.disabled) {
      void locateMe();
    }
  } catch {
    amapFailed.value = true;
    ready.value = false;
    void nextTick(() => {
      void measure().then(() => {
        if (!props.disabled) void locateMe();
      });
    });
  }
}

function pointPx(pt: GeoPoint) {
  return markerPixel(
    pt.lat,
    pt.lng,
    viewCenterLat.value,
    viewCenterLng.value,
    viewZoom.value,
    stageW.value,
    stageH.value,
  );
}

function polyPoints(ring: GeoPoint[]) {
  return ring.map((pt) => {
    const { x, y } = pointPx(pt);
    return `${x},${y}`;
  }).join(' ');
}

function applyStageSize(w: number, h: number) {
  stageW.value = w;
  stageH.value = h;
  ready.value = true;
}

async function measure() {
  if (isH5Dom()) {
    const { w, h } = measureMapStageDom('.area-map .map-wrap');
    applyStageSize(w, h);
    await nextTick();
    bindTileStageGestures();
    return;
  }
  uni
    .createSelectorQuery()
    .select('.map-wrap')
    .boundingClientRect((rect) => {
      if (!rect || Array.isArray(rect) || !rect.width) {
        const fb = defaultMapStageSize();
        applyStageSize(fb.w, fb.h);
        return;
      }
      applyStageSize(Math.round(rect.width), Math.max(Math.round(rect.height), 260));
    })
    .exec();
}

function notifyPointAdded() {
  uni.showToast({
    title: `已添加第 ${draftRing.value.length} 个锚点`,
    icon: 'none',
    duration: 900,
  });
}

function addPoint(localX: number, localY: number) {
  const { lat, lng } = pixelToLatLng(
    localX,
    localY,
    viewCenterLat.value,
    viewCenterLng.value,
    viewZoom.value,
    stageW.value,
    stageH.value,
  );
  draftRing.value = [...draftRing.value, { lat, lng }];
  syncAmapOverlays();
  notifyPointAdded();
}

function onResize() {
  if (!isH5Dom()) return;
  measure();
}

onMounted(() => {
  if (useAmapMode.value) {
    void nextTick(() => {
      void initAmapStage();
    });
    return;
  }
  const fb = defaultMapStageSize();
  applyStageSize(fb.w, fb.h);
  void nextTick(() => {
    void measure().then(() => {
      if (!props.disabled) void locateMe();
    });
    if (isH5Dom()) {
      window.addEventListener('resize', onResize);
    }
  });
});

onUnmounted(() => {
  if (isH5Dom()) {
    window.removeEventListener('resize', onResize);
  }
  unbindStageGestures?.();
  destroyAmap?.();
  amapMap = null;
  amapNs = null;
});

function undoPoint() {
  if (props.disabled || !draftRing.value.length) return;
  draftRing.value = draftRing.value.slice(0, -1);
  syncAmapOverlays();
}

function finishPolygon() {
  if (props.disabled || draftRing.value.length < 3) {
    uni.showToast({ title: '至少描 3 个点', icon: 'none' });
    return;
  }
  const poly: ServiceAreaPolygon = {
    id: `poly-${Date.now()}`,
    label: `区域${props.modelValue.polygons.length + 1}`,
    ring: [...draftRing.value],
  };
  emit('update:modelValue', {
    polygons: [...props.modelValue.polygons, poly],
  });
  draftRing.value = [];
  syncAmapOverlays();
}

function startNewPolygon() {
  draftRing.value = [];
  syncAmapOverlays();
}

watch(
  () => mapMode.value,
  (mode) => {
    if (mode === 'mark') {
      uni.showToast({ title: '描点模式：点击地图添加锚点', icon: 'none', duration: 1200 });
    }
  },
);

watch(
  () => props.modelValue,
  () => {
    draftRing.value = [];
    syncAmapOverlays();
  },
  { deep: true },
);

watch(draftRing, () => {
  syncAmapOverlays();
}, { deep: true });

watch(
  () => [props.centerLat, props.centerLng],
  () => {
    viewCenterLat.value = props.centerLat;
    viewCenterLng.value = props.centerLng;
  },
);
</script>

<style scoped>
.mode-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
  padding: 6rpx;
  background: var(--nb-surface-muted, #f5f0eb);
  border-radius: 999rpx;
}
.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 16rpx 12rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: var(--nb-text-muted, #888);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.mode-tab.active {
  background: #fff;
  color: var(--nb-primary, #c45c26);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(196, 92, 38, 0.12);
}
.mode-icon {
  font-size: 28rpx;
}
.hint {
  display: block;
  margin-bottom: 16rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
  line-height: 1.45;
}
.map-shell {
  border-radius: 16rpx;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}
.map-wrap {
  position: relative;
  width: 100%;
  height: 300px;
  background: #e8ecef;
}
.amap-stage {
  width: 100%;
  height: 100%;
  min-height: 300px;
  touch-action: manipulation;
}
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-size: 26rpx;
}
.stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  cursor: crosshair;
  background:
    linear-gradient(#dfe6eb 1px, transparent 1px),
    linear-gradient(90deg, #dfe6eb 1px, transparent 1px);
  background-size: 32px 32px;
  background-color: #d8e0e8;
}
.stage-mark {
  cursor: pointer;
}
.stage-hidden {
  visibility: hidden;
  pointer-events: none;
}
.tiles {
  position: absolute;
  inset: 0;
}
.tile {
  position: absolute;
  width: 256px;
  height: 256px;
  pointer-events: none;
}
.overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.attr {
  position: absolute;
  right: 8rpx;
  bottom: 6rpx;
  z-index: 3;
  font-size: 18rpx;
  color: rgba(0, 0, 0, 0.55);
  background: rgba(255, 255, 255, 0.75);
  padding: 2rpx 6rpx;
  border-radius: 4rpx;
}
.map-floats {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
.zoom-stack {
  position: absolute;
  right: 12rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  pointer-events: auto;
}
.float-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
  font-size: 36rpx;
  font-weight: 600;
  color: var(--nb-primary, #c45c26);
  line-height: 1;
}
.float-btn.locate {
  position: absolute;
  right: 12rpx;
  bottom: 48rpx;
  pointer-events: auto;
}
.float-btn.loading {
  opacity: 0.6;
}
.locate-icon {
  font-size: 40rpx;
}
.mark-hint {
  position: absolute;
  left: 12rpx;
  right: 12rpx;
  bottom: 12rpx;
  z-index: 4;
  padding: 10rpx 16rpx;
  text-align: center;
  font-size: 22rpx;
  color: #fff;
  background: rgba(46, 125, 50, 0.88);
  border-radius: 999rpx;
  pointer-events: none;
}
.action-row {
  display: flex;
  gap: 12rpx;
  padding: 16rpx;
  background: #fafafa;
  border-top: 1rpx solid #f0f0f0;
}
.action-chip {
  flex: 1;
  text-align: center;
  padding: 18rpx 8rpx;
  font-size: 24rpx;
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  border-radius: 12rpx;
}
.action-chip.primary {
  color: #fff;
  background: linear-gradient(135deg, #d4713f, #c45c26);
  font-weight: 600;
}
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}
.poly-tag {
  font-size: 22rpx;
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
}
.warn {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #c45c26;
}
.loc-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #666);
  line-height: 1.45;
}
</style>

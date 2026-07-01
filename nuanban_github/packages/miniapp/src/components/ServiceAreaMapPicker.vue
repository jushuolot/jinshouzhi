<template>
  <view class="area-map">
    <text class="hint">在地图上点击描点围成服务区域，可添加多个区域（至少3点完成一个区域）</text>
    <view v-if="!disabled" class="toolbar">
      <button class="tool-btn" size="mini" @tap="undoPoint">撤销上一点</button>
      <button class="tool-btn" size="mini" @tap="finishPolygon">完成当前区域</button>
      <button class="tool-btn" size="mini" @tap="startNewPolygon">新增区域</button>
    </view>
    <view class="map-wrap">
      <view v-if="!ready" class="loading">地图加载中…</view>
      <div
        v-if="useAmapMode"
        ref="amapHostRef"
        class="amap-stage"
        :class="{ 'stage-hidden': !ready }"
      />
      <view
        v-else
        class="stage"
        :class="{ 'stage-hidden': !ready }"
        :style="{ width: stageW + 'px', height: stageH + 'px' }"
        @tap.stop="onStageTap"
        @click.stop="onStagePointer"
        @touchend.stop.prevent="onStagePointer"
      >
        <view class="tiles">
          <!-- H5 用原生 img，避免 uni image 加载外链瓦片失败 -->
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
            v-for="(pt, idx) in allVisiblePoints"
            :key="'pt-' + idx"
            :cx="pointPx(pt).x"
            :cy="pointPx(pt).y"
            r="5"
            fill="#c45c26"
            stroke="#fff"
            stroke-width="1.5"
          />
        </svg>
        <text class="attr">{{ attribution }}</text>
      </view>
    </view>
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
  mapAttribution,
  nextMapTileProvider,
  pixelToLatLng,
  markerPixel,
  visibleOsmTiles,
  type MapTileProvider,
} from '../utils/geo-map';
import { createAmapMap } from '../utils/amap-h5';
import { useOfficialAmap } from '../utils/map-config';
import {
  emptyServiceAreaGeo,
  type ServiceAreaGeo,
  type ServiceAreaPolygon,
  type GeoPoint,
} from '../utils/service-area-geo';
import {
  defaultMapStageSize,
  eventToLocalPoint,
  isH5Dom,
  queryMapStageSize,
  uniTapToLocalPoint,
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
const tileProvider = ref<MapTileProvider>('auto');
const amapFailed = ref(false);
const amapHostRef = ref<HTMLElement | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let amapMap: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let amapNs: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const amapOverlays: any[] = [];
let destroyAmap: (() => void) | null = null;
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
      if (props.disabled) return;
      draftRing.value = [...draftRing.value, { lat: e.lnglat.getLat(), lng: e.lnglat.getLng() }];
      syncAmapOverlays();
    });
    ready.value = true;
    syncAmapOverlays();
  } catch {
    amapFailed.value = true;
    ready.value = false;
    void nextTick(() => {
      void measure();
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
    const { w, h } = await queryMapStageSize('.map-wrap');
    applyStageSize(w, h);
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
}

function onStageTap(e: { detail?: { x?: number; y?: number } }) {
  if (props.disabled || !ready.value) return;
  const el = document.querySelector('.area-map .stage') as HTMLElement | null;
  if (!el) return;
  const pt = uniTapToLocalPoint(e, el);
  if (!pt) return;
  addPoint(pt.x, pt.y);
}

function onStagePointer(e: MouseEvent | TouchEvent) {
  if (props.disabled || !ready.value) return;
  const el = (e.currentTarget || document.querySelector('.area-map .stage')) as HTMLElement | null;
  if (!el) return;
  const pt = eventToLocalPoint(e, el);
  if (!pt) return;
  addPoint(pt.x, pt.y);
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
    void measure();
    if (isH5Dom()) {
      window.addEventListener('resize', onResize);
    }
  });
});

onUnmounted(() => {
  if (isH5Dom()) {
    window.removeEventListener('resize', onResize);
  }
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
.hint {
  display: block;
  margin-bottom: 12rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
  line-height: 1.45;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 12rpx;
}
.tool-btn {
  margin: 0;
  background: #fff;
  color: var(--nb-primary, #c45c26);
  border: 2rpx solid var(--nb-primary, #c45c26);
}
.map-wrap {
  position: relative;
  width: 100%;
  height: 280px;
  background: #e8ecef;
  border-radius: 12rpx;
  overflow: hidden;
}
.amap-stage {
  width: 100%;
  height: 100%;
  min-height: 280px;
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
  position: relative;
  overflow: hidden;
  touch-action: manipulation;
  cursor: crosshair;
  background:
    linear-gradient(#dfe6eb 1px, transparent 1px),
    linear-gradient(90deg, #dfe6eb 1px, transparent 1px);
  background-size: 32px 32px;
  background-color: #d8e0e8;
}
.map-fallback-hint {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  font-size: 22rpx;
  color: #888;
  text-align: center;
  padding: 0 24rpx;
  pointer-events: none;
}
.stage-hidden {
  visibility: hidden;
  position: absolute;
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
</style>

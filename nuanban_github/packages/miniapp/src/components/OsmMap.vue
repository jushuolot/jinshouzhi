<template>
  <view class="osm-map" :style="{ height: mapHeight }">
    <view v-if="!ready" class="osm-loading">地图加载中…</view>
    <view v-else class="osm-stage" :style="{ width: stageW + 'px', height: stageH + 'px' }">
      <view class="osm-tiles">
        <img
          v-for="tile in tiles"
          :key="tile.key + '-' + tileProvider"
          class="osm-tile"
          :src="tile.url"
          :style="{ left: tile.x + 'px', top: tile.y + 'px' }"
          referrerpolicy="no-referrer"
          alt=""
          @error="onTileError"
        />
      </view>
      <view
        v-for="pin in pins"
        :key="String(pin.id)"
        class="osm-pin"
        :class="'kind-' + (pin.kind || 'other')"
        :style="{ left: pin.x + 'px', top: pin.y + 'px' }"
        @tap.stop="emit('markertap', pin.id)"
      >
        <view class="osm-pin-dot" />
        <text v-if="pin.label" class="osm-pin-label">{{ pin.label }}</text>
      </view>
      <text class="osm-attr">{{ attribution }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  mapAttribution,
  nextMapTileProvider,
  markerPixel,
  visibleOsmTiles,
  zoomToFitBounds,
  type MapPin,
  type MapTileProvider,
} from '../utils/geo-map';

const props = withDefaults(
  defineProps<{
    centerLat: number;
    centerLng: number;
    markers?: MapPin[];
    height?: string;
  }>(),
  {
    markers: () => [],
    height: '55vh',
  },
);

const emit = defineEmits<{
  markertap: [id: number | string];
}>();

const mapHeight = computed(() => props.height);
const ready = ref(false);
const stageW = ref(320);
const stageH = ref(360);
const viewCenterLat = ref(props.centerLat);
const viewCenterLng = ref(props.centerLng);
const viewZoom = ref(14);
const tileProvider = ref<MapTileProvider>('auto');
let tileErrorSwitches = 0;

const allPoints = computed(() => [
  { lat: props.centerLat, lng: props.centerLng },
  ...props.markers.map((m) => ({ lat: m.lat, lng: m.lng })),
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

const pins = computed(() => {
  const toPin = (m: MapPin) => {
    const { x, y } = markerPixel(
      m.lat,
      m.lng,
      viewCenterLat.value,
      viewCenterLng.value,
      viewZoom.value,
      stageW.value,
      stageH.value,
    );
    return { ...m, x, y };
  };
  const self: MapPin = {
    id: 0,
    lat: props.centerLat,
    lng: props.centerLng,
    label: '我的位置',
    kind: 'self',
  };
  return [toPin(self), ...props.markers.map(toPin)];
});

function fitView() {
  const fit = zoomToFitBounds(allPoints.value, stageW.value, stageH.value);
  viewCenterLat.value = fit.centerLat;
  viewCenterLng.value = fit.centerLng;
  viewZoom.value = fit.zoom;
}

function measure() {
  uni
    .createSelectorQuery()
    .select('.osm-map')
    .boundingClientRect((rect) => {
      if (!rect || Array.isArray(rect) || !rect.width) return;
      stageW.value = Math.round(rect.width);
      stageH.value = Math.max(Math.round(rect.height), 280);
      fitView();
      ready.value = true;
    })
    .exec();
}

onMounted(() => {
  measure();
});

watch(
  () => [props.centerLat, props.centerLng, props.markers],
  () => {
    if (ready.value) fitView();
  },
  { deep: true },
);
</script>

<style scoped>
.osm-map {
  position: relative;
  width: 100%;
  min-height: 360px;
  background: #e8ecef;
  overflow: hidden;
}
.osm-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 360px;
  color: #888;
  font-size: 26rpx;
}
.osm-stage {
  position: relative;
  overflow: hidden;
}
.osm-tiles {
  position: absolute;
  inset: 0;
}
.osm-tile {
  position: absolute;
  width: 256px;
  height: 256px;
  pointer-events: none;
}
.osm-pin {
  position: absolute;
  transform: translate(-50%, -100%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 120px;
}
.osm-pin-dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  border: 3rpx solid #fff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.25);
}
.kind-self .osm-pin-dot {
  background: #2196f3;
  width: 26rpx;
  height: 26rpx;
}
.kind-coop .osm-pin-dot {
  background: #c45c26;
}
.kind-other .osm-pin-dot {
  background: #888;
}
.osm-pin-label {
  margin-top: 4rpx;
  padding: 2rpx 8rpx;
  font-size: 20rpx;
  color: #333;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 6rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.osm-attr {
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
</style>

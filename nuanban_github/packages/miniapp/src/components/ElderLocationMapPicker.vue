<template>
  <view class="loc-map">
    <text class="hint">点击地图标记老人所在城市内的大概位置</text>
    <view v-if="!disabled" class="toolbar">
      <button class="tool-btn" size="mini" :loading="geocoding" @tap="centerOnCity">定位到城市</button>
      <button class="tool-btn" size="mini" @tap="clearPin">清除标记</button>
    </view>
    <view ref="mapWrapRef" class="map-wrap">
      <view v-if="!ready" class="loading">地图加载中…</view>
      <view
        v-else
        ref="stageRef"
        class="stage"
        :style="{ width: stageW + 'px', height: stageH + 'px' }"
        @click.stop="onStagePointer"
        @touchend.stop.prevent="onStagePointer"
      >
        <view class="tiles">
          <image
            v-for="tile in tiles"
            :key="tile.key"
            class="tile"
            :src="tile.url"
            :style="{ left: tile.x + 'px', top: tile.y + 'px' }"
            mode="scaleToFill"
          />
        </view>
        <view
          v-if="hasPin"
          class="pin"
          :style="{ left: pinPx.x + 'px', top: pinPx.y + 'px' }"
        >
          <view class="pin-dot" />
          <text class="pin-label">{{ cityLabel || '大概位置' }}</text>
        </view>
        <text class="attr">{{ OSM_ATTRIBUTION }}</text>
      </view>
    </view>
    <text v-if="hasPin" class="coord">
      {{ modelValue.lat.toFixed(4) }}, {{ modelValue.lng.toFixed(4) }}
    </text>
    <text v-else-if="!disabled" class="warn">请在地图上点击选点</text>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  OSM_ATTRIBUTION,
  markerPixel,
  pixelToLatLng,
  visibleOsmTiles,
  zoomToFitBounds,
} from '../utils/geo-map';
import { geocodeCityName } from '../utils/geocode-city';
import { eventToLocalPoint, isH5Dom, measureMapStage } from '../utils/h5-dom';

export type ElderMapPoint = { lat: number; lng: number };

const props = withDefaults(
  defineProps<{
    modelValue: ElderMapPoint | null;
    cityName?: string;
    disabled?: boolean;
    defaultLat?: number;
    defaultLng?: number;
  }>(),
  {
    cityName: '',
    disabled: false,
    defaultLat: 31.2304,
    defaultLng: 121.4737,
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: ElderMapPoint | null] }>();

const ready = ref(false);
const stageW = ref(320);
const stageH = ref(280);
const mapWrapRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const geocoding = ref(false);
const viewCenterLat = ref(props.defaultLat);
const viewCenterLng = ref(props.defaultLng);
const viewZoom = ref(12);

const hasPin = computed(
  () => props.modelValue != null && Number.isFinite(props.modelValue.lat) && Number.isFinite(props.modelValue.lng),
);

const cityLabel = computed(() => props.cityName?.trim() || '');

const pinPx = computed(() => {
  if (!hasPin.value || !props.modelValue) return { x: 0, y: 0 };
  return markerPixel(
    props.modelValue.lat,
    props.modelValue.lng,
    viewCenterLat.value,
    viewCenterLng.value,
    viewZoom.value,
    stageW.value,
    stageH.value,
  );
});

const tiles = computed(() =>
  visibleOsmTiles(viewCenterLat.value, viewCenterLng.value, viewZoom.value, stageW.value, stageH.value),
);

function fitToPin() {
  if (!hasPin.value || !props.modelValue) return;
  const fit = zoomToFitBounds([props.modelValue], stageW.value, stageH.value, 64);
  viewCenterLat.value = fit.centerLat;
  viewCenterLng.value = fit.centerLng;
  viewZoom.value = Math.min(fit.zoom, 14);
}

function measure() {
  const apply = (w: number, h: number) => {
    stageW.value = w;
    stageH.value = h;
    if (hasPin.value) fitToPin();
    ready.value = true;
  };

  if (isH5Dom()) {
    const el = mapWrapRef.value as unknown as HTMLElement | null;
    const { w, h } = measureMapStage(el, { w: 320, h: 280 });
    apply(w, h);
    return;
  }

  uni
    .createSelectorQuery()
    .select('.map-wrap')
    .boundingClientRect((rect) => {
      if (!rect || Array.isArray(rect) || !rect.width) {
        apply(320, 280);
        return;
      }
      apply(Math.round(rect.width), Math.max(Math.round(rect.height), 260));
    })
    .exec();
}

function onStagePointer(e: MouseEvent | TouchEvent) {
  if (props.disabled || !ready.value) return;
  const stage = stageRef.value as unknown as HTMLElement | null;
  if (!stage) return;
  const pt = eventToLocalPoint(e, stage);
  if (!pt) return;
  const { lat, lng } = pixelToLatLng(
    pt.x,
    pt.y,
    viewCenterLat.value,
    viewCenterLng.value,
    viewZoom.value,
    stageW.value,
    stageH.value,
  );
  emit('update:modelValue', { lat, lng });
}

function onResize() {
  if (!isH5Dom()) return;
  measure();
}

onMounted(() => {
  void nextTick(() => {
    measure();
    if (isH5Dom()) {
      window.addEventListener('resize', onResize);
    }
  });
});

onUnmounted(() => {
  if (isH5Dom()) {
    window.removeEventListener('resize', onResize);
  }
});

watch(
  () => props.modelValue,
  () => {
    if (ready.value && hasPin.value) fitToPin();
  },
  { deep: true },
);

async function centerOnCity() {
  const city = props.cityName?.trim();
  if (!city) {
    uni.showToast({ title: '请先填写所在城市', icon: 'none' });
    return;
  }
  geocoding.value = true;
  try {
    const hit = await geocodeCityName(city);
    if (!hit) {
      uni.showToast({ title: '未找到该城市，请手动点选', icon: 'none' });
      return;
    }
    viewCenterLat.value = hit.lat;
    viewCenterLng.value = hit.lng;
    viewZoom.value = hit.zoom;
    if (!hasPin.value) {
      emit('update:modelValue', { lat: hit.lat, lng: hit.lng });
    }
  } catch {
    uni.showToast({ title: '城市定位失败，请手动点选', icon: 'none' });
  } finally {
    geocoding.value = false;
  }
}

function clearPin() {
  emit('update:modelValue', null);
}
</script>

<style scoped>
.loc-map {
  margin-top: 8rpx;
}
.hint {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-muted, #888);
  margin-bottom: 12rpx;
}
.toolbar {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.tool-btn {
  font-size: 22rpx;
  background: var(--nb-surface, #fff);
  color: var(--nb-primary, #c45c26);
}
.map-wrap {
  position: relative;
  width: 100%;
  height: 360rpx;
  background: #e8ecef;
  border-radius: 12rpx;
  overflow: hidden;
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
  background-color: #e8ecef;
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
.pin {
  position: absolute;
  transform: translate(-50%, -100%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.pin-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #c45c26;
  border: 3rpx solid #fff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.25);
}
.pin-label {
  margin-top: 4rpx;
  padding: 2rpx 8rpx;
  font-size: 20rpx;
  color: #333;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 6rpx;
  max-width: 160rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
.coord {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
}
.warn {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8a6d3b;
}
</style>

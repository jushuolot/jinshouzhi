<template>
  <view class="page">
    <view v-if="order" class="card">
      <text class="svc">{{ order.serviceName }}</text>
      <text class="elder">服务老人 · {{ order.elderName }}</text>
      <text class="time">预约 {{ formatTime(order.scheduledAt) }}</text>
    </view>

    <view class="card loc">
      <text class="section">到场签到</text>
      <text class="loc-label">我的位置</text>
      <text class="loc-val">{{ locationLabel }}</text>
      <text v-if="isDemoLocation" class="demo-tag">演示定位（自动通过围栏）</text>
      <text class="loc-label">距服务点</text>
      <text class="loc-val" :class="{ ok: canCheckin, warn: !canCheckin }">
        {{ distanceText }}
      </text>
      <text class="fence-hint">需在服务点 500m 内签到（演示定位免校验）</text>
    </view>

    <button class="btn" :loading="loading" :disabled="!canCheckin" @tap="submit">
      确认签到并开始服务
    </button>
    <button class="btn-secondary" @tap="skip">返回订单</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { checkinOrder, getStudentOrder, type StudentOrderDetail } from '../../api/student';
import { getElderDetail } from '../../api/student';
import { formatDistanceKm, haversineKm, isWithinCheckinFence } from '../../utils/geo';
import { getLocationWithFallback } from '../../utils/location';
import { pbErrorMessage } from '../../utils/request';

const orderId = ref('');
const order = ref<StudentOrderDetail | null>(null);
const loading = ref(false);
const userLat = ref(0);
const userLng = ref(0);
const elderLat = ref(0);
const elderLng = ref(0);
const locationLabel = ref('定位中…');
const isDemoLocation = ref(false);
const distanceM = ref(9999);

const distanceText = computed(() => {
  if (!elderLat.value) return '—';
  return formatDistanceKm(distanceM.value / 1000);
});

const canCheckin = computed(() =>
  order.value?.status === 'pending_service'
    ? isWithinCheckinFence(distanceM.value, isDemoLocation.value)
    : false,
);

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function load() {
  if (!orderId.value) return;
  order.value = await getStudentOrder(orderId.value);
  if (order.value?.elderId) {
    const elder = await getElderDetail(order.value.elderId);
    elderLat.value = (elder?.latitude as number) || 31.2304;
    elderLng.value = (elder?.longitude as number) || 121.4737;
  }
  const loc = await getLocationWithFallback(3000);
  userLat.value = loc.lat;
  userLng.value = loc.lng;
  locationLabel.value = loc.label;
  isDemoLocation.value = loc.isDemo;
  if (elderLat.value && elderLng.value) {
    distanceM.value = haversineKm(userLat.value, userLng.value, elderLat.value, elderLng.value) * 1000;
  }
}

onLoad((q) => {
  if (q?.orderId) orderId.value = q.orderId as string;
  if (q?.id && !orderId.value) orderId.value = q.id as string;
});

onShow(load);

async function submit() {
  if (!orderId.value || !canCheckin.value) return;
  loading.value = true;
  try {
    await checkinOrder(orderId.value, userLat.value, userLng.value);
    uni.showToast({ title: '签到成功', icon: 'success' });
    setTimeout(() => {
      uni.redirectTo({ url: `/package-student/order/request?id=${orderId.value}` });
    }, 500);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function skip() {
  uni.navigateBack();
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
}
.svc {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
}
.elder,
.time {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #666;
}
.section {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}
.loc-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
}
.loc-val {
  display: block;
  font-size: 30rpx;
  margin-top: 6rpx;
}
.loc-val.ok {
  color: #2e7d32;
}
.loc-val.warn {
  color: #c62828;
}
.demo-tag {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #c45c26;
  background: #fff5ef;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.fence-hint {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #bbb;
}
.btn {
  background: #2e7d32;
  color: #fff;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}
.btn-secondary {
  background: #fff;
  color: #666;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
}
</style>

<template>
  <view class="page">
    <text class="tip">附近老人（演示坐标：上海）</text>
    <view v-for="e in list" :key="e.id" class="card" @tap="openElder(e.id)">
      <text>{{ e.name }}</text>
      <text class="meta">{{ e.distanceKm?.toFixed(1) ?? '?' }}km</text>
    </view>
    <view v-if="errorMsg" class="error" @tap="reload">
      <text>加载失败（点此重试）</text>
      <text class="mono">{{ errorMsg }}</text>
    </view>
    <view v-else-if="!loading && !list.length" class="empty">暂无附近老人</view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { listNearbyElders, type ElderRow } from '../../api/student';
import { pbErrorMessage } from '../../utils/request';

const list = ref<(ElderRow & { distanceKm: number })[]>([]);
const loading = ref(false);
const errorMsg = ref('');

async function reload() {
  loading.value = true;
  errorMsg.value = '';
  try {
    list.value = await listNearbyElders(31.2304, 121.4737);
  } catch (e) {
    list.value = [];
    errorMsg.value = pbErrorMessage(e);
  } finally {
    loading.value = false;
  }
}

onShow(reload);

function openElder(id: string) {
  uni.navigateTo({ url: `/package-student/order/request?id=${id}` });
}
</script>

<style scoped>
.page {
  padding: 24rpx;
}
.card {
  background: #fff;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-radius: 8rpx;
}
.meta {
  display: block;
  color: #666;
  font-size: 26rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
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

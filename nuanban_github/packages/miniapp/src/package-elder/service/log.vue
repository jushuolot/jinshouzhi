<template>
  <view class="page elder-mode" :class="fontClass">
    <view class="hero">
      <text class="hero-title">我的服务记录</text>
      <text class="hero-sub">已完成服务自动归档</text>
    </view>

    <ListCountBar :count="list.length" hint="大字号易读 · 可滚动" />

    <view v-if="loading" class="empty card">加载中…</view>
    <view v-for="log in list" :key="log.id" class="card">
      <text class="svc">{{ log.serviceName }}</text>
      <text class="summary">{{ log.summary }}</text>
      <text class="time">{{ formatTime(log.createdAt) }}</text>
    </view>
    <view v-if="!loading && !list.length" class="empty card">
      暂无记录，同学完成服务并确认后将显示在此
    </view>

    <RoleTabBar role="elder" current="/package-elder/home" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import { listElderServiceLogs, type ElderServiceLogItem } from '../../api/elder';
import { elderFontClass } from '../../utils/elder-accessibility';
import { guardPackageRoute } from '../../utils/nav-guard';
import { pbErrorMessage } from '../../utils/request';

const list = ref<ElderServiceLogItem[]>([]);
const loading = ref(false);
const fontClass = computed(() => elderFontClass());

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    list.value = await listElderServiceLogs();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  guardPackageRoute('/package-elder/service/log');
  reload();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.hero-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
}
.hero-sub {
  display: block;
  margin: 12rpx 0 24rpx;
  font-size: 28rpx;
  color: #666;
}
.card {
  background: #fff;
  padding: 32rpx 28rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}
.svc {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
}
.summary {
  display: block;
  margin-top: 16rpx;
  font-size: 30rpx;
  color: #444;
  line-height: 1.55;
}
.time {
  display: block;
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #888;
}
.empty {
  text-align: center;
  color: #888;
  font-size: 30rpx;
}
</style>

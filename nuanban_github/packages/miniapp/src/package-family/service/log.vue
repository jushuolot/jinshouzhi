<template>
  <view class="page nb-page">
    <view class="hero nb-hero">
      <text class="hero-title">服务记录</text>
      <text class="hero-sub">绑定老人的已完成服务归档</text>
    </view>

    <ListCountBar :count="list.length" hint="家属可查看 · 可滚动" />

    <view v-if="loading" class="empty nb-card">加载中…</view>
    <view v-for="log in list" :key="log.id" class="card nb-card">
      <view class="head">
        <text class="svc">{{ log.serviceName }}</text>
        <text class="elder-tag">{{ log.elderName }}</text>
      </view>
      <text class="summary">{{ log.summary }}</text>
      <text class="time">{{ formatTime(log.createdAt) }}</text>
    </view>
    <view v-if="!loading && !list.length" class="empty nb-card">
      暂无服务记录，学生完成服务并确认后将自动归档
    </view>

    <RoleTabBar role="family" current="/package-family/home" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import { listFamilyServiceLogs, type FamilyServiceLogItem } from '../../api/family';
import { guardPackageRoute } from '../../utils/nav-guard';
import { pbErrorMessage } from '../../utils/request';

const list = ref<FamilyServiceLogItem[]>([]);
const loading = ref(false);

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    list.value = await listFamilyServiceLogs();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  guardPackageRoute('/package-family/service/log');
  reload();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.hero-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.hero-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  opacity: 0.85;
}
.card {
  margin-bottom: 12rpx;
  padding: 28rpx 24rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}
.svc {
  font-size: 30rpx;
  font-weight: 600;
}
.elder-tag {
  font-size: 22rpx;
  color: var(--nb-text-secondary, #888);
  background: #f5f0eb;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.summary {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #555;
  line-height: 1.5;
}
.time {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #999;
}
.empty {
  padding: 40rpx 24rpx;
  text-align: center;
  color: #888;
  font-size: 26rpx;
}
</style>

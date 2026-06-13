<template>
  <view class="page">
    <ListCountBar :count="list.length" hint="已完成订单自动归档" />
    <view v-for="log in list" :key="log.id" class="card">
      <text class="svc">{{ log.serviceName }}</text>
      <text class="elder">{{ log.elderName }}</text>
      <text class="summary">{{ log.summary }}</text>
      <text class="time">{{ formatTime(log.createdAt) }}</text>
    </view>
    <view v-if="!loading && !list.length" class="empty">暂无服务日志，完成订单后自动生成</view>
    <RoleTabBar role="student" current="/package-student/profile" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import ListCountBar from '../../components/ListCountBar.vue';
import { listServiceLogs, type ServiceLogItem } from '../../api/student';
import { pbErrorMessage } from '../../utils/request';

const list = ref<ServiceLogItem[]>([]);
const loading = ref(false);

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    list.value = await listServiceLogs();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(reload);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.card {
  background: #fff;
  padding: 28rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}
.svc {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.elder {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #888;
}
.summary {
  display: block;
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #444;
  line-height: 1.5;
}
.time {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #bbb;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
}
</style>

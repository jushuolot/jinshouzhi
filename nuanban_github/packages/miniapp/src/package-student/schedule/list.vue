<template>
  <view class="page">
    <text class="tip">我的排班（接单后自动生成）</text>
    <view v-for="s in list" :key="s.id" class="card" @tap="onTap(s)">
      <view class="head">
        <text class="svc">{{ s.serviceName }}</text>
        <text class="tag" :class="s.status">{{ statusLabel(s.status) }}</text>
      </view>
      <text class="elder">{{ s.elderName }}</text>
      <text class="time">{{ formatTime(s.scheduledStart) }}</text>
    </view>
    <view v-if="!loading && !list.length" class="empty">暂无排班，接单后显示</view>
    <RoleTabBar role="student" current="/package-student/profile" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import { listStudentSchedules, type ScheduleItem } from '../../api/student';
import { orderStatusLabel } from '../../utils/order-status';
import { pbErrorMessage } from '../../utils/request';

const list = ref<ScheduleItem[]>([]);
const loading = ref(false);

function statusLabel(s: string) {
  return orderStatusLabel(s);
}

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    list.value = await listStudentSchedules();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(reload);

function onTap(s: ScheduleItem) {
  if (!s.orderId) return;
  if (s.status === 'pending_service') {
    uni.navigateTo({ url: `/package-student/schedule/checkin?orderId=${s.orderId}` });
    return;
  }
  uni.navigateTo({ url: `/package-student/order/request?id=${s.orderId}` });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.tip {
  color: #666;
  font-size: 26rpx;
}
.card {
  background: #fff;
  padding: 28rpx 24rpx;
  margin-top: 16rpx;
  border-radius: 12rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.svc {
  font-size: 32rpx;
  font-weight: 600;
}
.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #fff5ef;
  color: #c45c26;
}
.tag.in_service {
  background: #e8f5e9;
  color: #2e7d32;
}
.tag.completed {
  background: #f5f5f5;
  color: #999;
}
.elder {
  display: block;
  margin-top: 10rpx;
  color: #666;
  font-size: 26rpx;
}
.time {
  display: block;
  margin-top: 6rpx;
  color: #999;
  font-size: 24rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
</style>

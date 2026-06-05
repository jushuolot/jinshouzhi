<template>
  <view class="page">
    <view class="summary">
      <view class="sum-item">
        <text class="sum-label">本月收入</text>
        <text class="sum-num accent">¥{{ income?.monthIncomeYuan ?? '0.00' }}</text>
      </view>
      <view class="sum-divider" />
      <view class="sum-item">
        <text class="sum-label">累计收入</text>
        <text class="sum-num">¥{{ income?.totalIncomeYuan ?? '0.00' }}</text>
      </view>
    </view>

    <view class="section-title">已完成订单</view>
    <view v-for="r in income?.records ?? []" :key="r.id" class="record">
      <view class="record-main">
        <text class="svc">{{ r.serviceName }}</text>
        <text class="elder">{{ r.elderName }}</text>
        <text class="time">{{ formatTime(r.completedAt) }}</text>
      </view>
      <text class="amount">+¥{{ (r.amountCents / 100).toFixed(0) }}</text>
    </view>
    <view v-if="!loading && !(income?.records?.length)" class="empty">暂无已完成收入记录</view>

    <RoleTabBar role="student" current="/package-student/profile" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import { fetchStudentIncome, type StudentIncome } from '../api/student';
import { pbErrorMessage } from '../utils/request';

const income = ref<StudentIncome | null>(null);
const loading = ref(false);

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    income.value = await fetchStudentIncome();
  } catch (e) {
    income.value = null;
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
.summary {
  display: flex;
  background: linear-gradient(135deg, #fff8f0, #fff);
  border-radius: 16rpx;
  padding: 36rpx 0;
  margin-bottom: 32rpx;
}
.sum-item {
  flex: 1;
  text-align: center;
}
.sum-divider {
  width: 1rpx;
  background: #eee;
}
.sum-label {
  display: block;
  font-size: 24rpx;
  color: #888;
}
.sum-num {
  display: block;
  margin-top: 12rpx;
  font-size: 40rpx;
  font-weight: 600;
}
.sum-num.accent {
  color: #c45c26;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.record {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 28rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}
.record-main {
  flex: 1;
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
.time {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #bbb;
}
.amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #2e7d32;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
}
</style>

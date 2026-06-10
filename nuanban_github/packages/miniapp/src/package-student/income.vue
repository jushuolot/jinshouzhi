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

    <view class="withdraw-banner" @tap="goWithdraw">
      <view class="withdraw-main">
        <text class="withdraw-label">可提现余额</text>
        <text class="withdraw-amount">¥{{ withdrawal?.availableYuan ?? '—' }}</text>
      </view>
      <text class="withdraw-cta">去提现 ›</text>
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

    <view class="section-title">结算记录（演示）</view>
    <view v-for="s in settlements" :key="s.id" class="record settlement">
      <view class="record-main">
        <text class="svc">{{ s.period }} 月结</text>
        <text class="elder">{{ s.status === 'paid' ? '已打款' : '待结算' }}</text>
        <text v-if="s.paidAt" class="time">打款日 {{ s.paidAt }}</text>
      </view>
      <text class="amount" :class="{ pending: s.status === 'pending' }">
        ¥{{ (s.amountCents / 100).toFixed(2) }}
      </text>
    </view>
    <view v-if="!loading && !settlements.length" class="empty">暂无结算记录</view>

    <RoleTabBar role="student" current="/package-student/profile" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import {
  fetchStudentIncome,
  fetchStudentSettlements,
  fetchStudentWithdrawal,
  type SettlementRecord,
  type StudentIncome,
  type StudentWithdrawalOverview,
} from '../api/student';
import { pbErrorMessage } from '../utils/request';

const income = ref<StudentIncome | null>(null);
const settlements = ref<SettlementRecord[]>([]);
const withdrawal = ref<StudentWithdrawalOverview | null>(null);
const loading = ref(false);

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    const [inc, stl, wd] = await Promise.all([
      fetchStudentIncome(),
      fetchStudentSettlements(),
      fetchStudentWithdrawal(),
    ]);
    income.value = inc;
    settlements.value = stl;
    withdrawal.value = wd;
  } catch (e) {
    income.value = null;
    settlements.value = [];
    withdrawal.value = null;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goWithdraw() {
  uni.navigateTo({ url: '/package-student/withdrawal/index' });
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
.withdraw-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #c45c26, #e07a3a);
  color: #fff;
  padding: 28rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}
.withdraw-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
}
.withdraw-amount {
  display: block;
  margin-top: 8rpx;
  font-size: 40rpx;
  font-weight: 700;
}
.withdraw-cta {
  font-size: 28rpx;
  font-weight: 600;
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
.amount.pending {
  color: #c45c26;
}
.settlement {
  margin-top: 0;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
}
</style>

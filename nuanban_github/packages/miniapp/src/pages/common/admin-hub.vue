<template>
  <view class="page">
    <text class="title">运营演示</text>
    <text class="sub">平台撮合数据 · 机构派单 · 学校合作</text>

    <view class="kpi-grid">
      <view class="kpi">
        <text class="kpi-num accent">{{ overview?.ordersPendingAccept ?? pendingCount }}</text>
        <text class="kpi-label">待接单</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview?.ordersInService ?? '-' }}</text>
        <text class="kpi-label">服务中</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview?.ordersCompleted ?? '-' }}</text>
        <text class="kpi-label">已完成</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview?.eldersTotal ?? '-' }}</text>
        <text class="kpi-label">服务老人</text>
      </view>
    </view>

    <view v-if="overview" class="kpi-grid kpi-secondary">
      <view class="kpi">
        <text class="kpi-num accent">{{ overview.ordersPendingPayment ?? 0 }}</text>
        <text class="kpi-label">待支付</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">¥{{ overview.walletPaidTotalYuan ?? '0.00' }}</text>
        <text class="kpi-label">已付总额</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview.serviceLogCount ?? 0 }}</text>
        <text class="kpi-label">服务归档</text>
      </view>
    </view>

    <view v-if="overview" class="meta-row">
      <text>撮合成功率 {{ overview.matchSuccessRatePct }}%</text>
      <text>今日撮合 {{ overview.todayMatches }}</text>
    </view>

    <view class="section-title">功能入口</view>
    <view class="link-card highlight" @tap="goDispatch">
      <view class="link-main">
        <text class="link-title">机构派单</text>
        <text class="link-desc">将待接单订单指定给学生（{{ pendingCount }} 单可派）</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card" @tap="goSchoolCoop">
      <view class="link-main">
        <text class="link-title">学校合作配置</text>
        <text class="link-desc">只读展示机构↔学校合作</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card" @tap="goTour">
      <view class="link-main">
        <text class="link-title">动画演示</text>
        <text class="link-desc">22 秒看懂三种撮合路径</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card" @tap="goShare">
      <view class="link-main">
        <text class="link-title">分享演示链接</text>
        <text class="link-desc">复制给验收人 · 零安装</text>
      </view>
      <text class="chevron">›</text>
    </view>

    <view v-if="demoMode" class="reset-card" @tap="confirmReset">
      <text class="reset-title">重置演示数据</text>
      <text class="reset-desc">清除本地订单/储值卡状态，恢复种子数据</text>
    </view>

    <text v-if="overview?.updatedAt" class="ts">数据更新 {{ formatTime(overview.updatedAt) }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchPlatformOverview, type PlatformOverview } from '../../api/platform';
import { listDispatchableOrders } from '../../api/org';
import { isDemoMockEnabled, resetDemoRuntimeState } from '../../utils/demo-mock';
import { pbErrorMessage } from '../../utils/request';

const demoMode = isDemoMockEnabled();

const pendingCount = ref(0);
const overview = ref<PlatformOverview | null>(null);

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

async function reload() {
  try {
    const [list, o] = await Promise.all([
      listDispatchableOrders(),
      fetchPlatformOverview().catch(() => null),
    ]);
    pendingCount.value = list.length;
    if (o) overview.value = o;
  } catch (e) {
    pendingCount.value = 0;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

onShow(reload);

function goDispatch() {
  uni.navigateTo({ url: '/pages/common/org-dispatch' });
}

function goSchoolCoop() {
  uni.navigateTo({ url: '/pages/common/school-coop' });
}

function goTour() {
  uni.navigateTo({ url: '/pages/common/demo-tour' });
}

function goShare() {
  uni.navigateTo({ url: '/pages/common/share-demo' });
}

function confirmReset() {
  uni.showModal({
    title: '重置演示数据',
    content: '将清除订单、储值卡、提现等本地状态并刷新页面，是否继续？',
    confirmText: '重置',
    success: (res) => {
      if (res.confirm) resetDemoRuntimeState();
    },
  });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 48rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 24rpx;
  font-size: 24rpx;
  color: #888;
}
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.kpi-secondary {
  margin-bottom: 20rpx;
}
.kpi {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  text-align: center;
}
.kpi-num {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}
.kpi-num.accent {
  color: #c45c26;
}
.kpi-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #888;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 28rpx;
  padding: 0 8rpx;
  font-size: 22rpx;
  color: #999;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.link-card.highlight {
  border: 1rpx solid #f0dcc8;
  background: #fffaf5;
}
.link-card {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 28rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}
.link-main {
  flex: 1;
}
.link-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.link-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #888;
}
.chevron {
  font-size: 36rpx;
  color: #ccc;
}
.reset-card {
  margin-top: 8rpx;
  margin-bottom: 16rpx;
  padding: 24rpx;
  background: #fff3f0;
  border: 1rpx solid #f0c8b8;
  border-radius: 12rpx;
  text-align: center;
}
.reset-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #c45c26;
}
.reset-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999;
}
.ts {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #bbb;
}
</style>

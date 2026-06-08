<template>
  <view class="page">
    <text class="eyebrow">平台 · 上帝视角</text>
    <text class="title">暖伴勤工</text>
    <text class="mission">{{ overview?.mission || '加载中…' }}</text>

    <view v-if="overview" class="completion-card">
      <text class="pct">{{ overview.coreCompletionPct }}%</text>
      <text class="pct-label">核心撮合能力（演示评估）</text>
      <text class="audit">自动化审计 {{ overview.auditStatus }}</text>
    </view>

    <view v-if="overview" class="kpi-grid">
      <view class="kpi">
        <text class="kpi-num">{{ overview.eldersTotal }}</text>
        <text class="kpi-label">服务老人</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview.studentsActive }}</text>
        <text class="kpi-label">女大学生志愿者</text>
      </view>
      <view class="kpi">
        <text class="kpi-num accent">{{ overview.ordersPendingAccept }}</text>
        <text class="kpi-label">待接单</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ overview.ordersInService }}</text>
        <text class="kpi-label">服务中</text>
      </view>
    </view>

    <text class="section">三种撮合路径</text>
    <view v-for="p in overview?.matchingPaths || []" :key="p.id" class="path-card">
      <view class="path-head">
        <text class="path-title">{{ p.label }}</text>
        <text class="badge" :class="p.status">{{ statusLabel(p.status) }}</text>
      </view>
      <text class="path-desc">{{ p.description }}</text>
      <text class="path-metric">{{ p.metric }}：{{ p.metricValue }}</text>
    </view>

    <text class="section">5 分钟验收路径</text>
    <view class="checklist">
      <text>① 老人登录 → 找陪护（6 位同学）→ 预约</text>
      <text>② 学生登录 → 待接单 10 单 / 附近老人 8 位 → 接单完成</text>
      <text>③ 运营演示 → 机构派单 → 学校合作</text>
      <text>④ 家属代付 → mock 微信支付</text>
    </view>

    <button class="btn" @tap="goDemo">打开公网演示</button>
    <button class="btn-outline" @tap="reload">刷新数据</button>
    <text v-if="overview?.updatedAt" class="ts">更新 {{ formatTime(overview.updatedAt) }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchPlatformOverview, type PlatformOverview } from '../../api/platform';
import { pbErrorMessage } from '../../utils/request';

const overview = ref<PlatformOverview | null>(null);

function statusLabel(s: string) {
  if (s === 'live') return '已接通';
  if (s === 'demo') return '演示';
  return '规划';
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
}

async function reload() {
  try {
    overview.value = await fetchPlatformOverview();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

onShow(reload);

function goDemo() {
  const url = overview.value?.demoUrl || 'https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login';
  // #ifdef H5
  window.open(url, '_blank');
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: url });
  uni.showToast({ title: '链接已复制', icon: 'none' });
  // #endif
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #1a1a2e;
  color: #eee;
  padding: 32rpx;
  padding-bottom: 80rpx;
}
.eyebrow {
  display: block;
  font-size: 22rpx;
  color: #c45c26;
  letter-spacing: 2rpx;
}
.title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  margin-top: 8rpx;
}
.mission {
  display: block;
  margin: 16rpx 0 28rpx;
  font-size: 26rpx;
  color: #aaa;
  line-height: 1.5;
}
.completion-card {
  background: linear-gradient(135deg, #c45c26, #e88b4a);
  border-radius: 16rpx;
  padding: 36rpx;
  text-align: center;
  margin-bottom: 24rpx;
}
.pct {
  display: block;
  font-size: 72rpx;
  font-weight: 700;
  color: #fff;
}
.pct-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}
.audit {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.75);
}
.kpi-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 28rpx;
}
.kpi {
  width: calc(50% - 6rpx);
  background: #16213e;
  border-radius: 12rpx;
  padding: 24rpx;
  box-sizing: border-box;
}
.kpi-num {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
}
.kpi-num.accent {
  color: #e88b4a;
}
.kpi-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #888;
}
.section {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin: 24rpx 0 16rpx;
}
.path-card {
  background: #16213e;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
}
.path-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.path-title {
  font-size: 30rpx;
  font-weight: 600;
}
.badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.badge.live {
  background: #1b4332;
  color: #95d5b2;
}
.badge.demo {
  background: #3d2c1a;
  color: #e9c46a;
}
.badge.planned {
  background: #333;
  color: #999;
}
.path-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
}
.path-metric {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #e88b4a;
}
.checklist text {
  display: block;
  font-size: 24rpx;
  color: #bbb;
  margin-bottom: 12rpx;
  line-height: 1.5;
}
.btn {
  margin-top: 32rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
.btn-outline {
  margin-top: 16rpx;
  background: transparent;
  color: #e88b4a;
  border: 1rpx solid #e88b4a;
  border-radius: 12rpx;
}
.ts {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #666;
}
</style>

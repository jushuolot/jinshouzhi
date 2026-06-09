<template>
  <view class="page">
    <text class="eyebrow">平台 · 上帝视角</text>
    <text class="title">暖伴勤工</text>
    <text class="mission">{{ missionText }}</text>

    <view class="tour-banner" @tap="goTour">
      <text class="tour-icon">🎬</text>
      <view class="tour-body">
        <text class="tour-title">动画演示 · 22 秒看懂撮合</text>
        <text class="tour-sub">五幕自动轮播 · 进度条 · 无需登录</text>
      </view>
      <text class="tour-cta">观看 →</text>
    </view>

    <view class="completion-card">
      <text class="pct">{{ displayPct }}%</text>
      <text class="pct-label">核心撮合能力（演示评估）</text>
      <text class="audit">自动化审计 {{ auditStatus }} · 撮合成功率 {{ displayMatchRate }}%</text>
    </view>

    <view class="match-highlight">
      <text class="match-num">{{ displayTodayMatches }}</text>
      <text class="match-label">今日撮合成功（演示）</text>
    </view>

    <view class="kpi-grid">
      <view class="kpi">
        <text class="kpi-num">{{ displayElders }}</text>
        <text class="kpi-label">服务老人</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ displayStudents }}</text>
        <text class="kpi-label">女大学生志愿者</text>
      </view>
      <view class="kpi">
        <text class="kpi-num accent">{{ displayPending }}</text>
        <text class="kpi-label">待接单</text>
      </view>
      <view class="kpi">
        <text class="kpi-num">{{ displayInService }}</text>
        <text class="kpi-label">服务中</text>
      </view>
    </view>

    <text class="section">三种撮合路径</text>
    <view v-for="p in paths" :key="p.id" class="path-card">
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

    <button class="btn-outline" @tap="goLogin">进入演示登录</button>
    <button class="btn-outline" @tap="goShare">复制演示链接</button>
    <button class="btn-outline" @tap="reload">刷新数据</button>
    <text v-if="errorMsg" class="err">{{ errorMsg }}</text>
    <text v-if="lastUpdated" class="ts">最后更新 {{ formatTime(lastUpdated) }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchPlatformOverview, type MatchingPathStatus } from '../../api/platform';
import { APP_TAGLINE } from '../../config/brand';
import { BUILD_TIME } from '../../utils/build-info';
import { pbErrorMessage } from '../../utils/request';

const DEFAULT_PATHS: MatchingPathStatus[] = [
  {
    id: 'org_dispatch',
    label: '机构派单',
    description: '平台/养老院将订单指定给同学',
    status: 'demo',
    metric: '待派单',
    metricValue: 10,
  },
  {
    id: 'elder_find_student',
    label: '老人找同学',
    description: '老人按距离浏览女大学生志愿者并预约',
    status: 'live',
    metric: '附近同学',
    metricValue: 6,
  },
  {
    id: 'student_find_elder',
    label: '同学找需求',
    description: '学生看待接单池或附近老人并接单',
    status: 'live',
    metric: '附近老人',
    metricValue: 8,
  },
];

const missionText = ref(APP_TAGLINE);
const pct = ref(88);
const auditStatus = ref('PASS');
const eldersTotal = ref(8);
const studentsActive = ref(6);
const ordersPending = ref(10);
const ordersInService = ref(1);
const todayMatches = ref(13);
const matchSuccessRatePct = ref(94);
const paths = ref<MatchingPathStatus[]>([...DEFAULT_PATHS]);
const updatedAt = ref('');
const errorMsg = ref('');
const loading = ref(false);

const displayPct = ref(0);
const displayElders = ref(0);
const displayStudents = ref(0);
const displayPending = ref(0);
const displayInService = ref(0);
const displayTodayMatches = ref(0);
const displayMatchRate = ref(0);

function animateValue(from: number, to: number, setter: (v: number) => void, ms = 700) {
  const start = Date.now();
  const step = () => {
    const t = Math.min(1, (Date.now() - start) / ms);
    const eased = 1 - (1 - t) ** 2;
    setter(Math.round(from + (to - from) * eased));
    if (t < 1) {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(step);
      else setTimeout(step, 16);
    }
  };
  step();
}

function runKpiAnimation() {
  animateValue(displayPct.value, pct.value, (v) => {
    displayPct.value = v;
  });
  animateValue(displayElders.value, eldersTotal.value, (v) => {
    displayElders.value = v;
  });
  animateValue(displayStudents.value, studentsActive.value, (v) => {
    displayStudents.value = v;
  });
  animateValue(displayPending.value, ordersPending.value, (v) => {
    displayPending.value = v;
  });
  animateValue(displayInService.value, ordersInService.value, (v) => {
    displayInService.value = v;
  });
  animateValue(displayTodayMatches.value, todayMatches.value, (v) => {
    displayTodayMatches.value = v;
  });
  animateValue(displayMatchRate.value, matchSuccessRatePct.value, (v) => {
    displayMatchRate.value = v;
  });
}

const lastUpdated = computed(() => BUILD_TIME || updatedAt.value);

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
  if (loading.value) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    const o = await fetchPlatformOverview();
    missionText.value = o.mission;
    pct.value = o.coreCompletionPct;
    auditStatus.value = o.auditStatus;
    eldersTotal.value = o.eldersTotal;
    studentsActive.value = o.studentsActive;
    ordersPending.value = o.ordersPendingAccept;
    ordersInService.value = o.ordersInService;
    todayMatches.value = o.todayMatches ?? ordersInService.value + 12;
    matchSuccessRatePct.value = o.matchSuccessRatePct ?? 94;
    paths.value = o.matchingPaths?.length ? o.matchingPaths : DEFAULT_PATHS;
    updatedAt.value = o.updatedAt;
    runKpiAnimation();
  } catch (e) {
    errorMsg.value = `实时数据未更新：${pbErrorMessage(e)}（已显示默认演示数据）`;
    runKpiAnimation();
  } finally {
    loading.value = false;
  }
}

onShow(reload);

function goLogin() {
  uni.navigateTo({ url: '/pages/common/login' });
}

function goTour() {
  uni.navigateTo({ url: '/pages/common/demo-tour' });
}

function goShare() {
  uni.navigateTo({ url: '/pages/common/share-demo' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #1a1a2e;
  color: #eee;
  padding: 32rpx;
  padding-bottom: 80rpx;
  box-sizing: border-box;
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
  margin: 16rpx 0 20rpx;
  font-size: 26rpx;
  color: #aaa;
  line-height: 1.5;
}
.tour-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: linear-gradient(135deg, #2d1f3d, #1a2744);
  border: 2rpx solid #e88b4a;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}
.tour-icon {
  font-size: 44rpx;
}
.tour-body {
  flex: 1;
}
.tour-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}
.tour-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #e88b4a;
}
.tour-cta {
  font-size: 28rpx;
  color: #e88b4a;
  font-weight: 600;
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
.match-highlight {
  text-align: center;
  background: #16213e;
  border: 2rpx solid #e88b4a;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}
.match-num {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  color: #e88b4a;
}
.match-label {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #aaa;
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
.err {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #e9c46a;
}
.ts {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #666;
}
</style>

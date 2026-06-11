<template>
  <view class="page nb-page">
    <text class="title">运营模式</text>
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

    <view class="section-title">撮合动态</view>
    <view v-if="!activities.length" class="empty-activity">
      <text class="empty-icon">📭</text>
      <text class="empty-text">暂无动态 · 接单或支付后将自动记录</text>
    </view>
    <view v-for="a in activities" :key="a.id" class="activity-row">
      <text class="act-icon">{{ actIcon(a.kind) }}</text>
      <view class="act-body">
        <text class="act-title">{{ a.title }}</text>
        <text class="act-detail">{{ a.detail }}</text>
        <text class="act-time">{{ formatRelativeTime(a.createdAt) }}</text>
      </view>
    </view>

    <view class="section-title">功能入口</view>
    <view class="link-card" @tap="goModuleMap">
      <view class="link-main">
        <text class="link-title">产品模块地图</text>
        <text class="link-desc">三端分包 · 便捷直达各功能</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card" @tap="goSecurity">
      <view class="link-main">
        <text class="link-title">安全中心</text>
        <text class="link-desc">传输加密 · 隐私与权限</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card highlight" @tap="goScenario">
      <view class="link-main">
        <text class="link-title">深度验收向导</text>
        <text class="link-desc">9 步走完三角色闭环 · 进度可保存</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card highlight" @tap="goStudentProfiles">
      <view class="link-main">
        <text class="link-title">学生资料管理</text>
        <text class="link-desc">卡通头像 · 实名核验照 · 审核参考</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card highlight" @tap="goFunds">
      <view class="link-main">
        <text class="link-title">资金管理</text>
        <text class="link-desc">储值 · 支付 · 提现审批 · 对账</text>
      </view>
      <text class="chevron">›</text>
    </view>
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

    <view v-if="demoMode" class="seed-card" @tap="confirmSeed">
      <text class="seed-title">注入外出演示单</text>
      <text class="seed-desc">一键生成张奶奶陪同散步 · 待家属审批</text>
    </view>
    <view v-if="demoMode" class="reset-card" @tap="confirmReset">
      <text class="reset-title">重置演示数据</text>
      <text class="reset-desc">清除本地订单/储值卡状态，恢复种子数据</text>
    </view>

    <view class="ops-settings nb-card">
      <text class="section-title">运营设置</text>
      <view class="setting-row">
        <view class="setting-text">
          <text class="setting-label">隐藏运营入口</text>
          <text class="setting-desc">仅通过登录页「暖」图标进入</text>
        </view>
        <switch :checked="hiddenEntry" color="#c45c26" @change="onHiddenChange" />
      </view>
      <button class="btn-logout" @tap="logoutOps">退出运营模式</button>
    </view>

    <text v-if="overview?.updatedAt" class="ts">数据更新 {{ formatTime(overview.updatedAt) }}</text>
    <OpsSessionBar />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OpsSessionBar from '../../components/OpsSessionBar.vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchPlatformActivity, fetchPlatformOverview, seedDemoScenario, type PlatformOverview } from '../../api/platform';
import { listDispatchableOrders } from '../../api/org';
import { activityIcon } from '../../utils/demo-activity';
import type { ActivityEvent } from '../../utils/demo-activity';
import { isGuestBrowse } from '../../utils/guest-browse';
import { resetDemoRuntimeState } from '../../utils/demo-mock';
import { formatRelativeTime, formatShortTime } from '../../utils/format-time';
import {
  clearOpsSession,
  isOpsEntryHidden,
  requireOpsSession,
  setOpsEntryHidden,
} from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';

const demoMode = import.meta.env.DEV || isGuestBrowse();
const hiddenEntry = ref(isOpsEntryHidden());

const pendingCount = ref(0);
const overview = ref<PlatformOverview | null>(null);
const activities = ref<ActivityEvent[]>([]);
const seeding = ref(false);

function actIcon(kind: ActivityEvent['kind']) {
  return activityIcon(kind);
}

function formatTime(iso: string) {
  return formatShortTime(iso);
}

async function reload() {
  try {
    const [list, o, acts] = await Promise.all([
      listDispatchableOrders(),
      fetchPlatformOverview().catch(() => null),
      fetchPlatformActivity().catch(() => []),
    ]);
    pendingCount.value = list.length;
    if (o) overview.value = o;
    activities.value = acts.slice(0, 8);
  } catch (e) {
    pendingCount.value = 0;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

onShow(() => {
  if (!requireOpsSession()) return;
  hiddenEntry.value = isOpsEntryHidden();
  void reload();
});

function onHiddenChange(e: { detail: { value: boolean } }) {
  hiddenEntry.value = e.detail.value;
  setOpsEntryHidden(e.detail.value);
  uni.showToast({
    title: e.detail.value ? '已隐藏运营入口' : '已显示运营入口',
    icon: 'none',
  });
}

function logoutOps() {
  uni.showModal({
    title: '退出运营模式',
    content: '退出后需重新输入口令',
    success: (res) => {
      if (!res.confirm) return;
      clearOpsSession();
      uni.navigateBack();
    },
  });
}

function goModuleMap() {
  uni.navigateTo({ url: '/pages/common/module-map' });
}

function goSecurity() {
  uni.navigateTo({ url: '/pages/common/security' });
}

function goDispatch() {
  uni.navigateTo({ url: '/pages/common/org-dispatch' });
}

function goFunds() {
  uni.navigateTo({ url: '/pages/common/fund-admin' });
}

function goStudentProfiles() {
  uni.navigateTo({ url: '/pages/common/student-profiles' });
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

function goScenario() {
  uni.navigateTo({ url: '/pages/common/scenario-guide' });
}

async function confirmSeed() {
  if (seeding.value) return;
  seeding.value = true;
  try {
    const res = await seedDemoScenario();
    uni.showModal({
      title: '已注入演示单',
      content: `${res.elderName} · ${res.serviceName}\n请用 13800000004 登录家属端审批外出`,
      showCancel: false,
    });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    seeding.value = false;
  }
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
  padding: 24rpx;
  padding-bottom: 48rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.sub {
  display: block;
  margin: 8rpx 0 24rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
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
  background: var(--nb-surface);
  border-radius: var(--nb-radius-md);
  padding: 24rpx;
  text-align: center;
  box-shadow: var(--nb-shadow-soft);
}
.kpi-num {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.kpi-num.accent {
  color: var(--nb-primary);
}
.kpi-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
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
.empty-activity {
  text-align: center;
  padding: 32rpx 24rpx;
  background: var(--nb-surface);
  border-radius: var(--nb-radius-md);
  margin-bottom: 16rpx;
  box-shadow: var(--nb-shadow-soft);
}
.empty-icon {
  display: block;
  font-size: 40rpx;
  margin-bottom: 8rpx;
}
.empty-text {
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.link-card {
  display: flex;
  align-items: center;
  background: var(--nb-surface);
  padding: 28rpx 24rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 12rpx;
  box-shadow: var(--nb-shadow-soft);
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
.activity-row {
  display: flex;
  gap: 12rpx;
  background: var(--nb-surface);
  padding: 20rpx;
  border-radius: var(--nb-radius-md);
  margin-bottom: 10rpx;
  box-shadow: var(--nb-shadow-soft);
}
.act-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}
.act-body {
  flex: 1;
  min-width: 0;
}
.act-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
}
.act-detail {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #666;
}
.act-time {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #aaa;
}
.seed-card {
  margin-top: 8rpx;
  margin-bottom: 12rpx;
  padding: 24rpx;
  background: #fff8e6;
  border: 1rpx solid #f0d080;
  border-radius: 12rpx;
  text-align: center;
}
.seed-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #8a6d3b;
}
.seed-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999;
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
.ops-settings {
  margin-top: 28rpx;
  padding: 24rpx;
  background: var(--nb-surface);
  border-radius: var(--nb-radius-md);
  box-shadow: var(--nb-shadow-soft);
}
.setting-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.setting-text {
  flex: 1;
}
.setting-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
}
.setting-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.btn-logout {
  width: 100%;
  margin: 0;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
  background: var(--nb-page-bg, #f5f5f5);
  border: 2rpx solid var(--nb-border);
  border-radius: var(--nb-radius-sm);
}
.btn-logout::after {
  border: none;
}
</style>

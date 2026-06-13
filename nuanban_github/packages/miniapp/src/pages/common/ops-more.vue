<template>
  <view class="page nb-page">
    <text class="title">更多</text>
    <text class="sub">演示工具 · 安全验证 · 运营设置</text>

    <view class="section-title muted">演示与验收</view>
    <text class="section-hint">投资人 / QA 用，日常运营可忽略</text>
    <view class="link-card nb-card dim" @tap="goModuleMap">
      <text class="link-icon">🧩</text>
      <view class="link-main">
        <text class="link-title">产品模块地图</text>
        <text class="link-desc">三端分包 · 点按直达各功能页</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card nb-card dim" @tap="goScenario">
      <text class="link-icon">🧭</text>
      <view class="link-main">
        <text class="link-title">深度验收向导</text>
        <text class="link-desc">9 步走完三角色闭环</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card nb-card dim" @tap="goShare">
      <text class="link-icon">🔗</text>
      <view class="link-main">
        <text class="link-title">分享演示链接</text>
        <text class="link-desc">复制给验收人 · 零安装</text>
      </view>
      <text class="chevron">›</text>
    </view>

    <template v-if="demoMode">
      <view class="section-title muted">演示数据</view>
      <view class="demo-card" @tap="confirmSeed">
        <text class="demo-title">注入外出演示单</text>
        <text class="demo-desc">张奶奶陪同散步 · 待家属审批</text>
      </view>
      <view class="demo-card reset" @tap="confirmReset">
        <text class="demo-title">重置演示数据</text>
        <text class="demo-desc">恢复种子数据 · 清除本地状态</text>
      </view>
    </template>

    <view class="section-title">安全与验证</view>
    <view class="link-card nb-card" @tap="goSecurity">
      <text class="link-icon">🛡️</text>
      <view class="link-main">
        <text class="link-title">安全中心</text>
        <text class="link-desc">传输加密 · 鉴权模式 · 隐私说明</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card nb-card" @tap="goSmsOutbox">
      <text class="link-icon">📨</text>
      <view class="link-main">
        <text class="link-title">短信发件箱</text>
        <text class="link-desc">自建验证码记录 · 备案期人工核对</text>
      </view>
      <text class="chevron">›</text>
    </view>

    <view class="section-title">运营设置</view>
    <view class="settings nb-card">
      <view class="setting-row">
        <view class="setting-text">
          <text class="setting-label">隐藏运营入口</text>
          <text class="setting-desc">仅通过登录页「暖」图标进入</text>
        </view>
        <switch :checked="hiddenEntry" color="#c45c26" @change="onHiddenChange" />
      </view>
      <button class="btn-logout" @tap="logoutOps">退出运营台</button>
    </view>

    <OpsTabBar current="/pages/common/ops-more" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import OpsTabBar from '../../components/OpsTabBar.vue';
import { seedDemoScenario } from '../../api/platform';
import { isDemoMockEnabled, resetDemoRuntimeState } from '../../utils/demo-mock';
import {
  clearOpsSession,
  isOpsEntryHidden,
  requireOpsSession,
  setOpsEntryHidden,
} from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';

/** 仅 GitHub Pages / 显式 VITE_DEMO_MOCK / 游客：本地 parity 不显示浏览器 Mock 工具 */
const demoMode = isDemoMockEnabled();
const hiddenEntry = ref(isOpsEntryHidden());
const seeding = ref(false);

onShow(() => {
  if (!requireOpsSession()) return;
  hiddenEntry.value = isOpsEntryHidden();
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
    title: '退出运营台',
    content: '退出后需重新输入口令',
    success: (res) => {
      if (!res.confirm) return;
      clearOpsSession();
      uni.navigateBack();
    },
  });
}

function goSecurity() {
  uni.navigateTo({ url: '/pages/common/security' });
}

function goSmsOutbox() {
  uni.navigateTo({ url: '/pages/common/ops-sms' });
}

function goShare() {
  uni.navigateTo({ url: '/pages/common/share-demo' });
}

function goModuleMap() {
  uni.navigateTo({ url: '/pages/common/module-map' });
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
      content: `${res.elderName} · ${res.serviceName}\n请用已注册家属账号登录审批外出`,
      showCancel: false,
    });
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
  padding: 24rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 28rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.section-title.muted {
  color: var(--nb-text-secondary);
  font-size: 26rpx;
}
.section-hint {
  display: block;
  margin: -8rpx 0 16rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.link-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
}
.link-card.dim {
  opacity: 0.92;
}
.link-icon {
  font-size: 32rpx;
}
.link-main {
  flex: 1;
}
.link-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}
.link-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.chevron {
  font-size: 32rpx;
  color: #ccc;
}
.demo-card {
  margin-bottom: 12rpx;
  padding: 22rpx 24rpx;
  background: #fff8e6;
  border: 1rpx solid #f0d080;
  border-radius: var(--nb-radius-md);
}
.demo-card.reset {
  background: #fff3f0;
  border-color: #f0c8b8;
}
.demo-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #8a6d3b;
}
.demo-card.reset .demo-title {
  color: #c45c26;
}
.demo-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.settings {
  padding: 24rpx;
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

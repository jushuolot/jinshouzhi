<template>
  <view class="page nb-page">
    <view class="hero">
      <view class="logo-wrap">
        <text class="logo-char">暖</text>
      </view>
      <text class="title">运营模式</text>
      <text class="sub">平台 KPI · 派单 · 学校合作 · 演示工具</text>
    </view>

    <view class="card nb-card">
      <text class="label">运营口令</text>
      <input
        v-model="passphrase"
        class="input nb-input"
        password
        placeholder="请输入运营口令"
        placeholder-class="ph"
        @confirm="submit"
      />
      <text class="hint">测试版默认口令：暖伴2026 · 正式环境请向管理员索取。</text>
      <text class="entry-tip">入口：登录页底部「运营模式」· 闪屏连点 Logo · 模块地图 · 会话期内右下角「运营台」</text>
      <button class="btn nb-btn-primary" :loading="loading" @tap="submit">进入运营模式</button>
    </view>

    <view class="card nb-card settings">
      <text class="settings-title">入口设置</text>
      <view class="row">
        <view class="row-text">
          <text class="row-label">隐藏运营入口</text>
          <text class="row-desc">开启后菜单不再显示「运营模式」，仅登录页点按「暖」图标进入</text>
        </view>
        <switch :checked="hiddenEntry" color="#c45c26" @change="onHiddenChange" />
      </view>
    </view>
    <OpsSessionBar />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OpsSessionBar from '../../components/OpsSessionBar.vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  isOpsEntryHidden,
  setOpsEntryHidden,
  startOpsSession,
  verifyOpsPassphrase,
} from '../../utils/ops-mode';

const passphrase = ref('');
const loading = ref(false);
const hiddenEntry = ref(isOpsEntryHidden());

onLoad(() => {
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

function submit() {
  if (loading.value) return;
  if (!verifyOpsPassphrase(passphrase.value)) {
    uni.showToast({ title: '口令错误', icon: 'none' });
    return;
  }
  loading.value = true;
  startOpsSession();
  uni.showToast({ title: '已进入运营模式', icon: 'success' });
  setTimeout(() => {
    loading.value = false;
    uni.redirectTo({ url: '/pages/common/admin-hub' });
  }, 400);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx 28rpx 48rpx;
  background: var(--nb-page-bg, #f5f5f5);
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
  padding-top: 24rpx;
}
.logo-wrap {
  width: 100rpx;
  height: 100rpx;
  border-radius: 32rpx;
  background: var(--nb-primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--nb-shadow-primary);
  margin-bottom: 24rpx;
}
.logo-char {
  font-size: 56rpx;
  font-weight: 700;
  color: #fff;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--nb-text);
}
.sub {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
  text-align: center;
}
.card {
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}
.label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.input {
  width: 100%;
  box-sizing: border-box;
  height: 88rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
}
.hint {
  display: block;
  margin: 16rpx 0 12rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
  line-height: 1.5;
}
.entry-tip {
  display: block;
  margin-bottom: 28rpx;
  font-size: 22rpx;
  color: var(--nb-primary);
  line-height: 1.55;
}
.btn {
  width: 100%;
}
.settings-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}
.row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.row-text {
  flex: 1;
}
.row-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
}
.row-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
  line-height: 1.45;
}
</style>

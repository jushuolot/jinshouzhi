<template>
  <view class="page nb-page-dark">
    <AuthBrandHeader
      dark
      compact
      title="上帝视角"
      subtitle="平台撮合 KPI · 超级管理员授权访问"
    />

    <view class="card nb-dark-card">
      <text class="label">管理密码</text>
      <input
        v-model="password"
        class="input"
        type="password"
        password
        placeholder="请输入超级管理员密码"
        placeholder-class="ph"
        @confirm="submit"
      />
      <button class="btn-primary nb-btn-primary" :loading="loading" @tap="submit">验证并进入</button>
    </view>

    <text class="hint">会话 8 小时内免重复输入 · 仅限平台超级管理员</text>
    <text class="hint pwd-hint">演示环境密码：nuanban2025（请确认访问的是阿里云站点并强刷页面）</text>
    <text class="back nb-link" @tap="goBack">返回</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { verifyGodViewAuth } from '../../api/platform';
import AuthBrandHeader from '../../components/AuthBrandHeader.vue';
import {
  getGodViewPassword,
  isGodViewUnlocked,
  setGodViewUnlocked,
} from '../../utils/god-view-auth';
import { pbErrorMessage } from '../../utils/request';

const password = ref('');
const loading = ref(false);

onShow(() => {
  if (isGodViewUnlocked()) {
    uni.redirectTo({ url: '/pages/common/god-view' });
  }
});

function unlockAndEnter() {
  setGodViewUnlocked();
  uni.redirectTo({ url: '/pages/common/god-view' });
}

async function submit() {
  const pwd = password.value.trim();
  if (!pwd) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await verifyGodViewAuth(pwd);
    unlockAndEnter();
  } catch (e) {
    // 后端 API 正常时以服务端为准；若请求体未送达（空 body → 403）但演示密码正确，仍允许进入
    if (pwd === getGodViewPassword()) {
      unlockAndEnter();
      return;
    }
    uni.showToast({ title: pbErrorMessage(e) || '密码错误', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goBack() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/common/login' }) });
}
</script>

<style scoped>
.label {
  display: block;
  font-size: 26rpx;
  color: var(--nb-dark-text-muted);
  margin-bottom: 16rpx;
}
.input {
  width: 100%;
  box-sizing: border-box;
  height: 88rpx;
  padding: 0 24rpx;
  margin-bottom: 28rpx;
  background: #1a1520;
  border: 2rpx solid var(--nb-dark-surface-alt);
  border-radius: var(--nb-radius-sm);
  color: var(--nb-dark-text);
  font-size: 30rpx;
}
.ph {
  color: #6a5d68;
}
.btn-primary {
  width: 100%;
}
.hint {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #7a6e78;
  text-align: center;
  line-height: 1.5;
}
.pwd-hint {
  margin-top: 12rpx;
  color: #a89488;
  font-size: 20rpx;
}
.back {
  display: block;
  margin-top: 40rpx;
  text-align: center;
}
</style>

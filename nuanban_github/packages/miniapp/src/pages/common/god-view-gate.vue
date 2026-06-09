<template>
  <view class="page">
    <text class="eyebrow">超级管理员</text>
    <text class="title">上帝视角</text>
    <text class="sub">平台撮合 KPI 与进度看板 · 需授权访问</text>

    <view class="card">
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
      <button class="btn-primary" :loading="loading" @tap="submit">验证并进入</button>
    </view>

    <text class="hint">仅限平台超级管理员 · 会话 8 小时内免重复输入</text>
    <text class="back" @tap="goBack">返回</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { verifyGodViewAuth } from '../../api/platform';
import { isGodViewUnlocked, setGodViewUnlocked } from '../../utils/god-view-auth';
import { pbErrorMessage } from '../../utils/request';

const password = ref('');
const loading = ref(false);

onShow(() => {
  if (isGodViewUnlocked()) {
    uni.redirectTo({ url: '/pages/common/god-view' });
  }
});

async function submit() {
  if (!password.value.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await verifyGodViewAuth(password.value.trim());
    setGodViewUnlocked();
    uni.redirectTo({ url: '/pages/common/god-view' });
  } catch (e) {
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
.page {
  min-height: 100vh;
  background: #1a1a2e;
  color: #eee;
  padding: 80rpx 48rpx;
  box-sizing: border-box;
}
.eyebrow {
  display: block;
  font-size: 22rpx;
  color: #e88b4a;
  letter-spacing: 2rpx;
}
.title {
  display: block;
  margin-top: 12rpx;
  font-size: 48rpx;
  font-weight: 700;
}
.sub {
  display: block;
  margin: 16rpx 0 48rpx;
  font-size: 26rpx;
  color: #aaa;
  line-height: 1.5;
}
.card {
  background: #16213e;
  border: 2rpx solid #2a3a5c;
  border-radius: 20rpx;
  padding: 36rpx 32rpx;
}
.label {
  display: block;
  font-size: 26rpx;
  color: #ccc;
  margin-bottom: 16rpx;
}
.input {
  width: 100%;
  box-sizing: border-box;
  height: 88rpx;
  padding: 0 24rpx;
  margin-bottom: 28rpx;
  background: #0f1729;
  border: 2rpx solid #2a3a5c;
  border-radius: 12rpx;
  color: #fff;
  font-size: 30rpx;
}
.ph {
  color: #667;
}
.btn-primary {
  background: linear-gradient(135deg, #e88b4a, #c45c26);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
}
.btn-primary::after {
  border: none;
}
.hint {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #777;
  text-align: center;
}
.back {
  display: block;
  margin-top: 48rpx;
  text-align: center;
  font-size: 28rpx;
  color: #e88b4a;
}
</style>

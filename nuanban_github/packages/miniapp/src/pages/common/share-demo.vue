<template>
  <view class="page">
    <text class="title">演示链接分享</text>
    <text class="sub">复制发给验收人 · 零安装 · 公网 GitHub Pages</text>

    <view v-for="item in links" :key="item.id" class="card">
      <text class="card-title">{{ item.title }}</text>
      <text class="card-desc">{{ item.desc }}</text>
      <text class="url">{{ item.url }}</text>
      <button class="btn-copy" @tap="copyLink(item.url)">复制链接</button>
    </view>

    <view class="tip">
      <text>建议顺序：动画演示 → 上帝视角 → 登录并选择学生身份 → 待接单完成</text>
    </view>

    <button class="btn-outline" @tap="goBack">返回</button>
  </view>
</template>

<script setup lang="ts">
const BASE = 'https://jushuolot.github.io/jinshouzhi/nuanban';

const links = [
  {
    id: 'tour',
    title: '动画演示（22 秒）',
    desc: '五幕自动轮播 · 三种撮合路径',
    url: `${BASE}/#/pages/common/demo-tour`,
  },
  {
    id: 'god',
    title: '上帝视角 KPI',
    desc: '平台进度 · 待接单/服务中/完成',
    url: `${BASE}/#/pages/common/god-view`,
  },
  {
    id: 'login',
    title: '演示登录入口',
    desc: '一键登录 · 登录后选择老人/家属/学生身份',
    url: `${BASE}/#/pages/common/login`,
  },
  {
    id: 'tour-deeplink',
    title: '深链 · 直达动画',
    desc: 'launch?tour=1 适合外链',
    url: `${BASE}/#/pages/common/launch?tour=1`,
  },
  {
    id: 'tour-login',
    title: '动画结束 → 登录体验',
    desc: '末幕自动跳转登录页',
    url: `${BASE}/#/pages/common/login?from=tour`,
  },
];

function copyLink(url: string) {
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
  });
}

function goBack() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/common/login' }) });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 32rpx;
  padding-bottom: 80rpx;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}
.sub {
  display: block;
  margin: 12rpx 0 28rpx;
  font-size: 26rpx;
  color: #888;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #c45c26;
}
.card-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #666;
}
.url {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #999;
  word-break: break-all;
  line-height: 1.5;
}
.btn-copy {
  margin-top: 20rpx;
  background: #c45c26;
  color: #fff;
  font-size: 28rpx;
  border-radius: 12rpx;
}
.tip {
  margin: 24rpx 0;
  padding: 20rpx;
  background: #fff8f0;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #888;
  line-height: 1.6;
}
.btn-outline {
  margin-top: 16rpx;
  background: transparent;
  border: 2rpx solid #c45c26;
  color: #c45c26;
  font-size: 28rpx;
  border-radius: 12rpx;
}
</style>

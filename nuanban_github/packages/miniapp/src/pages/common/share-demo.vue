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
      <text>建议顺序：动画演示 → 13800000001 接单 → 13800000004 代付/服务记录 → 13800000005 老人端 → 运营演示重置</text>
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
    id: 'login',
    title: '演示登录入口',
    desc: '虚拟手机登录 · 登录后选择老人/家属/学生身份',
    url: `${BASE}/#/pages/common/login`,
  },
  {
    id: 'scenario',
    title: '深度验收向导',
    desc: '9 步三角色闭环 · 进度可保存',
    url: `${BASE}/#/pages/common/scenario-guide`,
  },
  {
    id: 'admin',
    title: '运营演示',
    desc: '平台 KPI · 撮合动态 · 注入外出演示单',
    url: `${BASE}/#/pages/common/admin-hub`,
  },
  {
    id: 'student-pending',
    title: '学生 · 待接单',
    desc: '需先登录 13800000001',
    url: `${BASE}/#/package-student/order/pending`,
  },
  {
    id: 'family-pay',
    title: '家属 · 订单列表',
    desc: '需先登录 13800000004 · 待支付/待确认',
    url: `${BASE}/#/package-family/order/list`,
  },
  {
    id: 'elder-home',
    title: '老人首页',
    desc: '需先登录 13800000005 · 含储值卡入口',
    url: `${BASE}/#/package-elder/home`,
  },
  {
    id: 'elder-logs',
    title: '老人 · 服务记录',
    desc: '需先登录 13800000005 · 已完成归档',
    url: `${BASE}/#/package-elder/service/log`,
  },
  {
    id: 'packages',
    title: '家属 · 服务包购买',
    desc: '3 档套餐 · 模拟购买',
    url: `${BASE}/#/package-family/package/buy`,
  },
  {
    id: 'family-logs',
    title: '家属 · 服务记录',
    desc: '需先登录 13800000004 · 已完成服务归档',
    url: `${BASE}/#/package-family/service/log`,
  },
  {
    id: 'student-logs',
    title: '学生 · 服务日志',
    desc: '需先登录 13800000001',
    url: `${BASE}/#/package-student/schedule/log`,
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

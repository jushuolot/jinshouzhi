<template>
  <view class="page nb-page">
    <view class="hero">
      <text class="title">选择演示数据</text>
      <text class="sub">动画演示结束 · 请选择要体验的身份演示数据</text>
    </view>

    <view
      v-for="opt in options"
      :key="opt.key"
      class="card nb-card"
      @tap="pick(opt.key)"
    >
      <text class="icon">{{ opt.icon }}</text>
      <text class="card-title">{{ opt.title }}</text>
      <text class="card-desc">{{ opt.desc }}</text>
      <text class="card-hint">{{ opt.hint }}</text>
    </view>

    <text class="foot-note">游客模式下可模拟操作，数据不会保存到本地或服务器</text>
  </view>
</template>

<script setup lang="ts">
import { ROLE_HOME, type RoleKey } from '../../config/tabs';
import { enterGuestBrowse } from '../../utils/guest-browse';

const options: {
  key: RoleKey;
  icon: string;
  title: string;
  desc: string;
  hint: string;
}[] = [
  {
    key: 'elder',
    icon: '🌸',
    title: '老人模式演示数据',
    desc: '张奶奶 · 找陪护 · 储值卡 · 一键求助',
    hint: '演示订单、附近大学生、服务记录',
  },
  {
    key: 'family',
    icon: '👨‍👩‍👧',
    title: '家属模式演示数据',
    desc: '绑定老人 · 代付订单 · 外出审批',
    hint: '演示待支付、待确认、储值卡与动态',
  },
  {
    key: 'student',
    icon: '🎓',
    title: '学生模式演示数据',
    desc: '林同学 · 待接单 · 收入与提现',
    hint: '演示接单池、附近老人、服务日志',
  },
];

function pick(role: RoleKey) {
  enterGuestBrowse(role);
  uni.reLaunch({ url: ROLE_HOME[role] });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx 28rpx 48rpx;
  background: var(--nb-page-bg, #f5f5f5);
}
.hero {
  margin-bottom: 32rpx;
  text-align: center;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--nb-text);
}
.sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--nb-text-muted);
  line-height: 1.5;
}
.card {
  margin-bottom: 20rpx;
  padding: 32rpx 28rpx;
}
.icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 12rpx;
}
.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-primary);
}
.card-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--nb-text);
}
.card-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.foot-note {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: var(--nb-text-muted);
  line-height: 1.55;
}
</style>

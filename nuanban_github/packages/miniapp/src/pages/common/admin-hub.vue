<template>
  <view class="page">
    <text class="title">运营演示</text>
    <text class="sub">小程序内零成本 Admin 替代 · 无需云后台</text>

    <view class="stat-card">
      <text class="stat-num">{{ pendingCount }}</text>
      <text class="stat-label">待派单（pending_accept）</text>
    </view>

    <view class="section-title">功能入口</view>
    <view class="link-card" @tap="goDispatch">
      <view class="link-main">
        <text class="link-title">机构派单</text>
        <text class="link-desc">将待接单订单指定给学生</text>
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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { listDispatchableOrders } from '../../api/org';
import { pbErrorMessage } from '../../utils/request';

const pendingCount = ref(0);

async function reload() {
  try {
    const list = await listDispatchableOrders();
    pendingCount.value = list.length;
  } catch (e) {
    pendingCount.value = 0;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

onShow(reload);

function goDispatch() {
  uni.navigateTo({ url: '/pages/common/org-dispatch' });
}

function goSchoolCoop() {
  uni.navigateTo({ url: '/pages/common/school-coop' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 24rpx;
  font-size: 24rpx;
  color: #888;
}
.stat-card {
  background: linear-gradient(135deg, #fff8f0, #fff);
  border-radius: 16rpx;
  padding: 36rpx;
  text-align: center;
  margin-bottom: 32rpx;
}
.stat-num {
  display: block;
  font-size: 56rpx;
  font-weight: 600;
  color: #c45c26;
}
.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #888;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.link-card {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 28rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
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
</style>

<template>
  <view class="page">
    <view v-if="displayName" class="hero">
      <text class="name">{{ displayName }}</text>
      <text v-if="distanceKm" class="distance">约 {{ distanceKm }} km</text>
      <text v-if="orgName" class="org">{{ orgName }}</text>
    </view>

    <view class="notice">
      <text class="notice-title">V1 演示说明</text>
      <text class="notice-body">
        此处仅展示老人档案信息。如需接单，请返回学生首页，点击「待接单」处理派单。
      </text>
    </view>

    <view v-if="errorMsg" class="error">{{ errorMsg }}</view>

    <button class="btn-primary" @tap="goBack">返回列表</button>
    <button class="btn-outline" @tap="contactStub">联系 / 申请陪护</button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { getElderDetail } from '../../api/student';
import { pbErrorMessage } from '../../utils/request';

const elderId = ref('');
const displayName = ref('');
const distanceKm = ref('');
const orgName = ref('');
const errorMsg = ref('');

onLoad(async (q) => {
  elderId.value = (q?.id as string) || '';
  displayName.value = decodeURIComponent((q?.name as string) || '');
  distanceKm.value = (q?.distanceKm as string) || '';
  orgName.value = decodeURIComponent((q?.orgName as string) || '');

  if (!elderId.value) {
    errorMsg.value = '缺少老人信息';
    return;
  }

  if (!displayName.value || !orgName.value) {
    try {
      const elder = await getElderDetail(elderId.value);
      if (elder) {
        displayName.value = displayName.value || elder.name;
        orgName.value = orgName.value || elder.expand?.org?.name || '';
      }
    } catch (e) {
      if (!displayName.value) errorMsg.value = pbErrorMessage(e);
    }
  }
});

function goBack() {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/package-student/discover/list' });
    },
  });
}

function contactStub() {
  uni.showToast({
    title: '演示功能：正式版由机构派单或首页待接单',
    icon: 'none',
    duration: 3000,
  });
}
</script>

<style scoped>
.page {
  padding: 32rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.hero {
  background: #fff;
  padding: 40rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}
.name {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
  color: #333;
}
.distance {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #c45c26;
}
.org {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #888;
}
.notice {
  background: #fff8f0;
  border: 1rpx solid #f0dcc8;
  padding: 28rpx;
  border-radius: 12rpx;
  margin-bottom: 32rpx;
}
.notice-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #c45c26;
}
.notice-body {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}
.error {
  margin-bottom: 24rpx;
  color: #b71c1c;
  font-size: 26rpx;
}
.btn-primary {
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}
.btn-outline {
  background: #fff;
  color: #c45c26;
  border: 2rpx solid #c45c26;
  border-radius: 12rpx;
}
</style>

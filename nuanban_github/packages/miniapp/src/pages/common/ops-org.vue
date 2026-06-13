<template>
  <view class="page nb-page">
    <text class="title">机构</text>
    <text class="sub">养老院档案 · 学校合作 · 派单入口</text>

    <view v-if="incompleteCount > 0" class="alert-card" @tap="goElderProfiles('incomplete')">
      <text class="alert-icon">⚠️</text>
      <view class="alert-body">
        <text class="alert-title">{{ incompleteCount }} 位老人机构档案待补充</text>
        <text class="alert-desc">区域、健康、居住情况等需运营填写</text>
      </view>
      <text class="chevron">›</text>
    </view>

    <view class="section-title">档案与合作</view>
    <view class="link-card nb-card" @tap="goElderProfiles()">
      <text class="link-icon">👵</text>
      <view class="link-main">
        <text class="link-title">老人机构档案</text>
        <text class="link-desc">维护区域、健康状况、居住情况、所属机构</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card nb-card" @tap="goSchoolCoop">
      <text class="link-icon">🏫</text>
      <view class="link-main">
        <text class="link-title">学校合作</text>
        <text class="link-desc">维护机构与学校的合作关系</text>
      </view>
      <text class="chevron">›</text>
    </view>
    <view class="link-card nb-card" @tap="goServiceCatalog">
      <text class="link-icon">🛎️</text>
      <view class="link-main">
        <text class="link-title">服务目录</text>
        <text class="link-desc">配置预约服务类目与价格 · 老人端可选</text>
      </view>
      <text class="chevron">›</text>
    </view>

    <view class="section-title">撮合</view>
    <view class="link-card nb-card" @tap="goDispatch">
      <text class="link-icon">📋</text>
      <view class="link-main">
        <text class="link-title">机构派单</text>
        <text class="link-desc">待接单订单指定给学生（底部「派单」Tab 亦可）</text>
      </view>
      <text class="chevron">›</text>
    </view>

    <OpsTabBar current="/pages/common/ops-org" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import OpsTabBar from '../../components/OpsTabBar.vue';
import { fetchOpsElderProfiles } from '../../api/platform';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';
// #ifdef H5
import { syncDevicePreviewRoute } from '../../utils/device-preview';
// #endif

const incompleteCount = ref(0);

function goElderProfiles(filter?: string) {
  const q = filter === 'incomplete' ? '?filter=incomplete' : '';
  uni.navigateTo({ url: `/pages/common/ops-elder-profiles${q}` });
}

function goSchoolCoop() {
  uni.navigateTo({ url: '/pages/common/school-coop' });
}

function goServiceCatalog() {
  uni.navigateTo({ url: '/pages/common/ops-service-catalog' });
}

function goDispatch() {
  uni.redirectTo({ url: '/pages/common/org-dispatch' });
}

async function reload() {
  try {
    const res = await fetchOpsElderProfiles({ page: 1, pageSize: 1, incomplete: true });
    incompleteCount.value = res.total;
  } catch (e) {
    incompleteCount.value = 0;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

onShow(() => {
  if (!requireOpsSession()) return;
  // #ifdef H5
  syncDevicePreviewRoute();
  // #endif
  void reload();
});
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
  color: var(--nb-text-muted, #888);
}
.alert-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  background: #fff8e6;
  border: 1rpx solid #f0d080;
  border-radius: var(--nb-radius-md, 12rpx);
}
.alert-icon {
  font-size: 32rpx;
}
.alert-body {
  flex: 1;
}
.alert-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #8a6d3b;
}
.alert-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.link-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
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
  color: var(--nb-text-muted, #888);
}
.chevron {
  font-size: 32rpx;
  color: #ccc;
}
</style>

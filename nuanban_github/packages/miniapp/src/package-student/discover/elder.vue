<template>
  <view class="page">
    <view v-if="loading" class="state">加载中…</view>
    <template v-else>
      <MatchScoreBadge v-if="matchScore" :score="matchScore" />

      <view class="profile-hero">
        <view class="avatar">{{ avatarChar }}</view>
        <view class="hero-info">
          <text class="name">{{ displayName }}</text>
          <text v-if="age" class="meta">{{ age }} 岁 · {{ orgName }}</text>
          <text v-if="distanceKm" class="distance">约 {{ distanceKm }} km</text>
        </view>
      </view>

      <view v-if="tags.length" class="card">
        <text class="card-title">特点标签</text>
        <view class="tags">
          <text v-for="tag in tags" :key="tag" class="tag">{{ tag }}</text>
        </view>
      </view>

      <view v-if="intro" class="card">
        <text class="card-title">简介</text>
        <text class="intro">{{ intro }}</text>
      </view>

      <view class="card">
        <text class="card-title">服务说明</text>
        <text class="intro">老人档案由机构维护。接单请前往「接单」Tab 处理待接订单；附近老人列表仅供了解需求分布。</text>
      </view>

      <view v-if="errorMsg" class="error">{{ errorMsg }}</view>

      <button class="btn-primary" @tap="goPending">查看待接单</button>
      <button class="btn-outline" @tap="goBack">返回列表</button>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { getElderDetail } from '../../api/student';
import MatchScoreBadge from '../../components/MatchScoreBadge.vue';
import { computeMatchScore, parseDistanceKm } from '../../utils/match-score';
import { pbErrorMessage } from '../../utils/request';

const elderId = ref('');
const displayName = ref('');
const distanceKm = ref('');
const orgName = ref('');
const age = ref<number | null>(null);
const tags = ref<string[]>([]);
const intro = ref('');
const loading = ref(true);
const errorMsg = ref('');

const avatarChar = computed(() => displayName.value.slice(0, 1) || '老');

const matchScore = computed(() => {
  const km = parseDistanceKm(distanceKm.value);
  if (km == null) return 0;
  return computeMatchScore({ distanceKm: km });
});

onLoad(async (q) => {
  elderId.value = (q?.id as string) || '';
  displayName.value = decodeURIComponent((q?.name as string) || '');
  distanceKm.value = (q?.distanceKm as string) || '';
  orgName.value = decodeURIComponent((q?.orgName as string) || '');

  if (!elderId.value) {
    errorMsg.value = '缺少老人信息';
    loading.value = false;
    return;
  }

  try {
    const elder = await getElderDetail(elderId.value);
    if (elder) {
      displayName.value = displayName.value || elder.name;
      orgName.value = orgName.value || elder.expand?.org?.name || '';
      age.value = (elder as { age?: number }).age ?? null;
      tags.value = (elder as { tags?: string[] }).tags || [];
      intro.value = (elder as { intro?: string }).intro || '';
    }
  } catch (e) {
    if (!displayName.value) errorMsg.value = pbErrorMessage(e);
  } finally {
    loading.value = false;
  }
});

function goBack() {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/package-student/discover/list' });
    },
  });
}

function goPending() {
  uni.redirectTo({ url: '/package-student/order/pending' });
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.profile-hero {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff8f0, #fff);
  padding: 40rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  line-height: 120rpx;
  text-align: center;
  background: #c45c26;
  color: #fff;
  font-size: 48rpx;
  font-weight: 600;
  border-radius: 50%;
  margin-right: 28rpx;
}
.name {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}
.meta {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #888;
}
.distance {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #c45c26;
}
.card {
  background: #fff;
  padding: 28rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}
.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.tag {
  padding: 6rpx 18rpx;
  font-size: 24rpx;
  color: #c45c26;
  background: #fff5ef;
  border-radius: 24rpx;
}
.intro {
  font-size: 28rpx;
  color: #666;
  line-height: 1.7;
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
  margin-bottom: 20rpx;
}
.btn-outline {
  background: #fff;
  color: #c45c26;
  border: 2rpx solid #c45c26;
  border-radius: 12rpx;
}
.state {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>

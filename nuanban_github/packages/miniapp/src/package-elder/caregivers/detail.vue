<template>
  <view class="page elder-mode">
    <MatchScoreBadge v-if="matchScore" :score="matchScore" />

    <view class="profile-hero">
      <view class="avatar">{{ avatarChar }}</view>
      <view class="hero-info">
        <text class="name">{{ name || '同学' }}</text>
        <text class="meta">{{ school || '高校志愿者' }}</text>
        <view class="hero-row">
          <text v-if="distance" class="distance">{{ distance }}</text>
          <text v-if="rating" class="rating">★ {{ rating }}</text>
        </view>
        <text v-if="orderCount" class="extra">已服务 {{ orderCount }} 次</text>
      </view>
    </view>

    <view v-if="tags.length" class="card">
      <text class="card-title">擅长服务</text>
      <view class="tags">
        <text v-for="tag in tags" :key="tag" class="tag">{{ tag }}</text>
      </view>
    </view>

    <view v-if="intro" class="card">
      <text class="card-title">个人简介</text>
      <text class="intro">{{ intro }}</text>
    </view>

    <button class="btn-primary" @tap="goOrder">选择服务并预约</button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import MatchScoreBadge from '../../components/MatchScoreBadge.vue';
import { computeMatchScore, parseDistanceKm } from '../../utils/match-score';

const studentUserId = ref('');
const name = ref('');
const school = ref('');
const distance = ref('');
const rating = ref('');
const orderCount = ref('');
const intro = ref('');
const tags = ref<string[]>([]);

const avatarChar = computed(() => decodeURIComponent(name.value || '同').slice(0, 1));

const matchScore = computed(() => {
  const km = parseDistanceKm(distance.value);
  const ratingNum = rating.value ? parseFloat(rating.value) : undefined;
  const orders = orderCount.value ? parseInt(orderCount.value, 10) : undefined;
  if (km == null && ratingNum == null) return 0;
  return computeMatchScore({
    distanceKm: km,
    rating: ratingNum,
    orderCount: Number.isNaN(orders) ? undefined : orders,
  });
});

onLoad((q) => {
  studentUserId.value = (q?.studentUserId as string) || '';
  name.value = decodeURIComponent((q?.name as string) || '');
  school.value = decodeURIComponent((q?.school as string) || '');
  distance.value = decodeURIComponent((q?.distance as string) || '');
  rating.value = (q?.rating as string) || '';
  orderCount.value = (q?.orderCount as string) || '';
  intro.value = decodeURIComponent((q?.intro as string) || '');
  const tagStr = decodeURIComponent((q?.tags as string) || '');
  tags.value = tagStr ? tagStr.split(',').filter(Boolean) : [];
});

function goOrder() {
  uni.navigateTo({
    url: `/package-elder/order/create?studentUserId=${studentUserId.value}`,
  });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.profile-hero {
  display: flex;
  align-items: flex-start;
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
  flex-shrink: 0;
}
.name {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}
.meta {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #888;
}
.hero-row {
  display: flex;
  gap: 20rpx;
  margin-top: 12rpx;
}
.distance {
  font-size: 26rpx;
  color: #c45c26;
}
.rating {
  font-size: 26rpx;
  color: #f5a623;
  font-weight: 600;
}
.extra {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
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
.btn-primary {
  margin-top: 32rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
</style>

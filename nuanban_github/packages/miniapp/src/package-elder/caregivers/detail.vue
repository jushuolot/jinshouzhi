<template>
  <view class="page elder-mode">
    <view v-if="loading" class="state">加载中…</view>
    <template v-else-if="profile">
      <MatchScoreBadge v-if="matchScore" :score="matchScore" />

      <view class="profile-hero">
        <view class="avatar">{{ avatarChar }}</view>
        <view class="hero-info">
          <text class="name">{{ profile.name }}</text>
          <text class="meta">{{ profile.school }} · {{ profile.grade }}</text>
          <view class="hero-row">
            <text v-if="profile.distance" class="distance">{{ profile.distance }}</text>
            <text class="rating">★ {{ profile.rating }}</text>
          </view>
          <text class="extra">已服务 {{ profile.orderCount }} 次</text>
        </view>
      </view>

      <ProfileDetailCard :sections="detailSections" />

      <button class="btn-primary" @tap="goOrder">选择服务并预约</button>
    </template>
    <view v-else class="state">未找到陪护同学信息</view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { getCaregiverDetail, type CaregiverProfileDetail } from '../../api/elder';
import MatchScoreBadge from '../../components/MatchScoreBadge.vue';
import ProfileDetailCard, { type ProfileDetailSection } from '../../components/ProfileDetailCard.vue';
import { computeMatchScore, parseDistanceKm } from '../../utils/match-score';
import { pbErrorMessage } from '../../utils/request';

const caregiverId = ref('');
const profile = ref<CaregiverProfileDetail | null>(null);
const loading = ref(true);

const avatarChar = computed(() => (profile.value?.name || '同').slice(0, 1));

const matchScore = computed(() => {
  const p = profile.value;
  if (!p) return 0;
  const km = p.distanceKm ?? parseDistanceKm(p.distance || '');
  if (km == null && !p.rating) return 0;
  return computeMatchScore({
    distanceKm: km ?? undefined,
    rating: p.rating,
    orderCount: p.orderCount,
  });
});

const detailSections = computed((): ProfileDetailSection[] => {
  const p = profile.value;
  if (!p) return [];
  return [
    {
      title: '学业信息',
      rows: [
        { label: '学校', value: p.school },
        { label: '专业', value: p.major },
        { label: '年级', value: p.grade },
        { label: '年龄', value: `${p.age} 岁` },
        { label: '性别', value: p.gender },
        { label: '联系电话', value: p.phone },
      ],
    },
    {
      title: '服务能力',
      tags: p.serviceTypes,
      rows: [
        { label: '服务区域', value: p.serviceAreas.join('、') },
        { label: '语言能力', value: p.languages.join('、') },
        { label: '资质证书', value: p.certifications.join('、') },
      ],
      note: p.bio,
    },
    {
      title: '可服务时间',
      rows: p.availableHours.map((h, i) => ({
        label: i === 0 ? '时段' : '',
        value: h,
      })),
      tags: p.personalityTags,
    },
    {
      title: '个人简介',
      note: p.intro,
      tags: p.tags,
    },
    {
      title: '评价摘要',
      rows: p.completedOrderThemes.map((t, i) => ({
        label: i === 0 ? '服务记录' : '',
        value: t,
      })),
      note: p.reviewSummary,
    },
  ];
});

onLoad(async (q) => {
  caregiverId.value = (q?.id as string) || (q?.studentUserId as string) || '';
  if (!caregiverId.value) {
    loading.value = false;
    return;
  }
  try {
    profile.value = await getCaregiverDetail(caregiverId.value);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
});

function goOrder() {
  const uid = profile.value?.userId || caregiverId.value;
  uni.navigateTo({
    url: `/package-elder/order/create?studentUserId=${uid}`,
  });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--nb-page-bg, #f5f5f5);
  padding: 24rpx;
}
.profile-hero {
  display: flex;
  align-items: flex-start;
  background: var(--nb-hero-gradient, linear-gradient(135deg, #fff8f0, #fff));
  padding: 40rpx 32rpx;
  border-radius: var(--nb-radius-md, 16rpx);
  margin-bottom: 24rpx;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  line-height: 120rpx;
  text-align: center;
  background: var(--nb-primary, #c45c26);
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
  color: var(--nb-text, #333);
}
.meta {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--nb-text-muted, #888);
}
.hero-row {
  display: flex;
  gap: 20rpx;
  margin-top: 12rpx;
}
.distance {
  font-size: 26rpx;
  color: var(--nb-primary, #c45c26);
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
  color: var(--nb-text-muted, #999);
}
.btn-primary {
  margin-top: 32rpx;
  background: var(--nb-primary, #c45c26);
  color: #fff;
  border-radius: var(--nb-radius-sm, 12rpx);
}
.state {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>

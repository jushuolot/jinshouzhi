<template>
  <view class="page">
    <view v-if="loading" class="state">加载中…</view>
    <template v-else>
      <MatchScoreBadge v-if="matchScore" :score="matchScore" />

      <view class="profile-hero">
        <view class="avatar">{{ avatarChar }}</view>
        <view class="hero-info">
          <text class="name">{{ displayName }}</text>
          <text v-if="age" class="meta">{{ age }} 岁 · {{ gender }} · {{ orgName }}</text>
          <text v-if="distanceKm" class="distance">约 {{ distanceKm }} km</text>
        </view>
      </view>

      <ProfileDetailCard :sections="detailSections" />

      <view v-if="errorMsg" class="error">{{ errorMsg }}</view>

      <button class="btn-primary" @tap="goPending">查看待接单</button>
      <button class="btn-outline" @tap="goBack">返回列表</button>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchElderProfile, type ElderProfileDetail } from '../../api/student';
import MatchScoreBadge from '../../components/MatchScoreBadge.vue';
import ProfileDetailCard, { type ProfileDetailSection } from '../../components/ProfileDetailCard.vue';
import { computeMatchScore, parseDistanceKm } from '../../utils/match-score';
import { pbErrorMessage } from '../../utils/request';

const elderId = ref('');
const profile = ref<ElderProfileDetail | null>(null);
const displayName = ref('');
const distanceKm = ref('');
const loading = ref(true);
const errorMsg = ref('');

const avatarChar = computed(() => (profile.value?.name || displayName.value).slice(0, 1) || '老');
const age = computed(() => profile.value?.age);
const gender = computed(() => profile.value?.gender);
const orgName = computed(() => profile.value?.orgName || '');

const matchScore = computed(() => {
  const km = parseDistanceKm(distanceKm.value);
  if (km == null) return 0;
  return computeMatchScore({ distanceKm: km });
});

const detailSections = computed((): ProfileDetailSection[] => {
  const p = profile.value;
  if (!p) return [];
  return [
    {
      title: '基本信息',
      rows: [
        { label: '姓名', value: p.name },
        { label: '年龄', value: `${p.age} 岁` },
        { label: '性别', value: p.gender },
        { label: '所在区域', value: p.district },
        { label: '居住地址', value: p.address },
        { label: '所属机构', value: p.orgName },
        { label: '居住情况', value: p.livingSituation },
      ],
    },
    {
      title: '健康状况',
      rows: [
        { label: '健康概况', value: p.healthStatus },
        { label: '行动能力', value: p.mobility },
      ],
      tags: p.tags,
    },
    {
      title: '兴趣爱好',
      tags: p.hobbies,
      note: p.intro,
    },
    {
      title: '服务偏好',
      tags: p.servicePreferences,
      rows: p.preferredVisitTimes.map((t, i) => ({
        label: i === 0 ? '期望时段' : '',
        value: t,
      })),
    },
    {
      title: '紧急联系人',
      rows: [
        { label: '姓名', value: p.emergencyContact.name },
        { label: '关系', value: p.emergencyContact.relation },
        { label: '电话', value: p.emergencyContact.phone },
      ],
      note: p.notes,
    },
  ];
});

onLoad(async (q) => {
  elderId.value = (q?.id as string) || '';
  displayName.value = decodeURIComponent((q?.name as string) || '');
  distanceKm.value = (q?.distanceKm as string) || '';

  if (!elderId.value) {
    errorMsg.value = '缺少老人信息';
    loading.value = false;
    return;
  }

  try {
    profile.value = await fetchElderProfile(elderId.value);
    displayName.value = profile.value.name;
  } catch (e) {
    errorMsg.value = pbErrorMessage(e);
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
  background: var(--nb-page-bg, #f5f5f5);
}
.profile-hero {
  display: flex;
  align-items: center;
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
}
.name {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: var(--nb-text, #333);
}
.meta {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: var(--nb-text-muted, #888);
}
.distance {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--nb-primary, #c45c26);
}
.error {
  margin-bottom: 24rpx;
  color: #b71c1c;
  font-size: 26rpx;
}
.btn-primary {
  background: var(--nb-primary, #c45c26);
  color: #fff;
  border-radius: var(--nb-radius-sm, 12rpx);
  margin-bottom: 20rpx;
}
.btn-outline {
  background: #fff;
  color: var(--nb-primary, #c45c26);
  border: 2rpx solid var(--nb-primary, #c45c26);
  border-radius: var(--nb-radius-sm, 12rpx);
}
.state {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>

<template>
  <view class="page nb-page">
    <view class="hero nb-hero">
      <text class="hero-title">推荐同学 · 有奖拉新</text>
      <text class="hero-sub">邀请在校女同学加入暖伴勤工，双方受益</text>
    </view>

    <view class="code-card nb-card">
      <text class="label">我的推荐码</text>
      <text class="code">{{ overview?.code || '—' }}</text>
      <view class="actions">
        <button class="btn nb-btn-primary" @tap="copyCode">复制推荐码</button>
        <button class="btn nb-btn-soft" @tap="copyLink">复制邀请链接</button>
      </view>
    </view>

    <view class="rule-card nb-card">
      <text class="rule-title">奖励规则（演示）</text>
      <text class="rule-line">① 同学通过你的链接注册学生身份 → ¥{{ registerYuan }} 待到账</text>
      <text class="rule-line">② 同学完成首单服务 → 再得 ¥{{ orderYuan }}，计入结算</text>
    </view>

    <view class="stats nb-stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ overview?.invitedCount ?? 0 }}</text>
        <text class="stat-label">已邀请</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num accent">¥{{ pendingYuan }}</text>
        <text class="stat-label">待到账</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">¥{{ earnedYuan }}</text>
        <text class="stat-label">累计奖励</text>
      </view>
    </view>

    <text class="section nb-section-title">推荐记录</text>
    <view v-if="loading" class="empty">加载中…</view>
    <view v-else-if="!overview?.records?.length" class="empty nb-card">暂无记录，分享链接给同学吧</view>
    <view v-for="r in overview?.records ?? []" :key="r.id" class="record nb-card">
      <view class="record-main">
        <text class="name">{{ r.inviteeName }}</text>
        <text class="meta">{{ formatTime(r.createdAt) }} · {{ statusLabel(r.status) }}</text>
      </view>
      <text class="amount" :class="{ pending: r.status !== 'rewarded' }">
        +¥{{ (r.rewardCents / 100).toFixed(0) }}
      </text>
    </view>

    <RoleTabBar role="student" current="/package-student/profile" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../../components/RoleTabBar.vue';
import { fetchStudentReferral, type StudentReferralOverview } from '../../api/referral';
import { REFERRAL_REWARD_FIRST_ORDER_CENTS, REFERRAL_REWARD_REGISTER_CENTS } from '../../utils/demo-referral';
import { guardPackageRoute } from '../../utils/nav-guard';
import { pbErrorMessage } from '../../utils/request';

const overview = ref<StudentReferralOverview | null>(null);
const loading = ref(false);

const registerYuan = (REFERRAL_REWARD_REGISTER_CENTS / 100).toFixed(0);
const orderYuan = (REFERRAL_REWARD_FIRST_ORDER_CENTS / 100).toFixed(0);
const pendingYuan = computed(() => ((overview.value?.pendingRewardCents ?? 0) / 100).toFixed(2));
const earnedYuan = computed(() => ((overview.value?.totalEarnedCents ?? 0) / 100).toFixed(2));

function statusLabel(s: string) {
  if (s === 'rewarded') return '已结算';
  if (s === 'first_order') return '待首单奖励';
  return '已注册';
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('zh-CN');
  } catch {
    return iso;
  }
}

async function reload() {
  loading.value = true;
  try {
    overview.value = await fetchStudentReferral();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!guardPackageRoute('/package-student/referral/index')) return;
  reload();
});

function copyCode() {
  if (!overview.value?.code) return;
  uni.setClipboardData({
    data: overview.value.code,
    success: () => uni.showToast({ title: '推荐码已复制', icon: 'success' }),
  });
}

function copyLink() {
  if (!overview.value?.inviteLink) return;
  uni.setClipboardData({
    data: overview.value.inviteLink,
    success: () => uni.showToast({ title: '邀请链接已复制', icon: 'success' }),
  });
}
</script>

<style scoped>
.page {
  padding-bottom: 140rpx;
}
.hero-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--nb-text);
}
.hero-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
}
.code-card {
  text-align: center;
  margin-top: 8rpx;
}
.label {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.code {
  display: block;
  margin: 16rpx 0 24rpx;
  font-size: 56rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
  color: var(--nb-primary);
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.btn {
  width: 100%;
}
.rule-card {
  margin-top: 8rpx;
}
.rule-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--nb-text);
  margin-bottom: 12rpx;
}
.rule-line {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-secondary);
  line-height: 1.7;
}
.stats {
  margin-top: 8rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-num {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--nb-text);
}
.stat-num.accent {
  color: var(--nb-primary);
}
.stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.stat-divider {
  width: 2rpx;
  background: var(--nb-border);
  margin: 8rpx 0;
}
.section {
  margin-top: 16rpx;
}
.record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
}
.name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.amount {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--nb-primary);
}
.amount.pending {
  color: var(--nb-text-muted);
}
.empty {
  text-align: center;
  padding: 32rpx;
  color: var(--nb-text-muted);
  font-size: 26rpx;
}
</style>

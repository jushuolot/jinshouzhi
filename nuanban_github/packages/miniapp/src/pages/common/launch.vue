<template>
  <view class="splash" @tap="skipSplash">
    <view class="safe-top" />

    <view class="center">
      <view class="logo-mark">
        <text class="logo-char">暖</text>
      </view>
      <text class="title">{{ APP_TITLE }}</text>
      <text class="tagline">{{ APP_TAGLINE }}</text>
      <view class="demo-badge">
        <text class="demo-badge-text">{{ DEMO_DISCLAIMER }}</text>
      </view>
    </view>

    <view class="bottom">
      <view class="load-track">
        <view class="load-bar" :style="{ width: progressPct + '%' }" />
      </view>
      <text class="skip-hint">轻触跳过</text>
      <text class="copyright">{{ COPYRIGHT_LINE }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { ref } from 'vue';
import {
  APP_TAGLINE,
  APP_TITLE,
  COPYRIGHT_LINE,
  DEMO_DISCLAIMER,
} from '../../config/brand';
import { DEEP_LINK_MAP, type RoleKey } from '../../config/tabs';
import { navigateAfterAuth } from '../../utils/profile-onboarding';
import { useRoleStore } from '../../store/role';
import {
  resolveUnauthenticatedEntry,
  splashDurationMs,
} from '../../utils/tour-onboarding';

const roleStore = useRoleStore();

const progressPct = ref(0);
let splashTimer: ReturnType<typeof setTimeout> | null = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;
let navigated = false;
let launchQuery: Record<string, string | undefined> = {};
let forceTour = false;
let splashMs = 1800;

function clearSplashTimers() {
  if (splashTimer) {
    clearTimeout(splashTimer);
    splashTimer = null;
  }
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function skipSplash() {
  if (navigated) return;
  clearSplashTimers();
  progressPct.value = 100;
  proceedAfterSplash();
}

function startSplash() {
  clearSplashTimers();
  progressPct.value = 0;
  const tickMs = 40;
  const steps = Math.max(1, Math.floor(splashMs / tickMs));
  let step = 0;
  progressTimer = setInterval(() => {
    step += 1;
    progressPct.value = Math.min(100, Math.round((step / steps) * 100));
    if (step >= steps && progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }, tickMs);
  splashTimer = setTimeout(proceedAfterSplash, splashMs);
}

function proceedAfterSplash() {
  if (navigated) return;
  navigated = true;
  clearSplashTimers();
  progressPct.value = 100;

  const query = launchQuery;

  if (query?.share === '1') {
    uni.reLaunch({ url: '/pages/common/share-demo' });
    return;
  }
  if (query?.ref) {
    uni.setStorageSync('pending_referral_code', String(query.ref).trim().toUpperCase());
    uni.reLaunch({ url: '/pages/common/login' });
    return;
  }

  const role = query?.role as RoleKey | undefined;
  const target = query?.target as string | undefined;
  const id = query?.id as string | undefined;

  if (!roleStore.isLoggedIn) {
    uni.reLaunch({ url: resolveUnauthenticatedEntry(forceTour) });
    return;
  }

  if (role) {
    roleStore.setActiveRole(role);
  }
  if (target && DEEP_LINK_MAP[target]) {
    const link = DEEP_LINK_MAP[target];
    roleStore.setActiveRole(link.role);
    uni.reLaunch({ url: link.path(id) });
    return;
  }
  if (roleStore.activeRole) {
    void navigateAfterAuth(roleStore.activeRole);
    return;
  }
  if (roleStore.hasMultipleRoles) {
    uni.reLaunch({ url: '/pages/common/role-select' });
    return;
  }
  const r = roleStore.activeRoles[0]?.role;
  if (r) void navigateAfterAuth(r);
  else uni.reLaunch({ url: '/pages/common/register' });
}

onLoad((query) => {
  launchQuery = (query || {}) as Record<string, string | undefined>;
  forceTour = launchQuery.tour === '1';
  splashMs = splashDurationMs(forceTour);
  startSplash();
});

onUnload(clearSplashTimers);
</script>

<style scoped>
.splash {
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: linear-gradient(165deg, #fff8f0 0%, #fff5eb 45%, #ffefe0 100%);
  color: var(--nb-text, #3d2a1f);
  padding: 0 48rpx  calc(48rpx + env(safe-area-inset-bottom));
}
.safe-top {
  height: env(safe-area-inset-top);
  flex-shrink: 0;
}
.center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24rpx 0;
}
.logo-mark {
  width: 160rpx;
  height: 160rpx;
  border-radius: 40rpx;
  background: linear-gradient(145deg, #e88b4a 0%, #c45c26 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 48rpx rgba(196, 92, 38, 0.28);
  margin-bottom: 36rpx;
  animation: logoIn 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.logo-char {
  font-size: 72rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
.title {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  color: var(--nb-primary, #c45c26);
  letter-spacing: 4rpx;
  margin-bottom: 16rpx;
}
.tagline {
  display: block;
  font-size: 28rpx;
  color: var(--nb-text-secondary, #6b5748);
  line-height: 1.5;
  max-width: 520rpx;
}
.demo-badge {
  margin-top: 32rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(196, 92, 38, 0.1);
  border: 1rpx solid rgba(196, 92, 38, 0.22);
}
.demo-badge-text {
  font-size: 22rpx;
  color: var(--nb-primary, #c45c26);
}
.bottom {
  flex-shrink: 0;
  text-align: center;
}
.load-track {
  height: 6rpx;
  background: rgba(196, 92, 38, 0.12);
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}
.load-bar {
  height: 100%;
  background: linear-gradient(90deg, #e88b4a, #c45c26);
  border-radius: 6rpx;
  transition: width 0.04s linear;
}
.skip-hint {
  display: block;
  font-size: 22rpx;
  color: var(--nb-text-muted, #a89488);
  margin-bottom: 28rpx;
}
.copyright {
  display: block;
  font-size: 20rpx;
  color: var(--nb-text-muted, #a89488);
  line-height: 1.5;
}
@keyframes logoIn {
  from {
    opacity: 0;
    transform: scale(0.88) translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>

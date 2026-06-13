<template>
  <view class="splash">
    <view class="safe-top" />

    <view class="center">
      <view class="logo-mark" @tap.stop="onLogoTap">
        <text class="logo-char">暖</text>
      </view>
      <text class="title">{{ APP_TITLE }}</text>
      <text class="tagline">{{ APP_TAGLINE }}</text>
      <text class="version">{{ APP_VERSION_LINE }}</text>
      <text v-if="loggedInHint" class="welcome-hint">{{ loggedInHint }}</text>
    </view>

    <view class="bottom">
      <view class="load-track">
        <view class="load-bar" :style="{ width: progressPct + '%' }" />
      </view>
      <text v-if="!loggedIn" class="skip-hint" @tap="skipSplash">轻触跳过</text>
      <text class="copyright">{{ COPYRIGHT_LINE }}</text>
    </view>
    <OpsSessionBar />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { ref } from 'vue';
import {
  APP_TAGLINE,
  APP_TITLE,
  APP_VERSION_LINE,
  COPYRIGHT_LINE,
} from '../../config/brand';
import { DEEP_LINK_MAP, type RoleKey } from '../../config/tabs';
import { navigateAfterAuth } from '../../utils/profile-onboarding';
import { useRoleStore } from '../../store/role';
import OpsSessionBar from '../../components/OpsSessionBar.vue';
import { openOpsMode } from '../../utils/ops-mode';
import {
  hasSeenTour,
  LOGGED_IN_SPLASH_MS,
  resolveReturnEntryPath,
  resolveUnauthenticatedEntry,
  RETURN_SPLASH_MS,
} from '../../utils/tour-onboarding';

const roleStore = useRoleStore();

const progressPct = ref(0);
const loggedIn = ref(false);
const loggedInHint = ref('');
let splashTimer: ReturnType<typeof setTimeout> | null = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;
let navigated = false;
let launchQuery: Record<string, string | undefined> = {};
let forceTour = false;
let openOpsDirect = false;
let splashMs = RETURN_SPLASH_MS;
let lastLogoTap = 0;

function openOps() {
  navigated = true;
  clearSplashTimers();
  openOpsMode();
}

function onLogoTap() {
  const now = Date.now();
  if (now - lastLogoTap < 450) {
    openOps();
    lastLogoTap = 0;
    return;
  }
  lastLogoTap = now;
}

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
  if (navigated || loggedIn.value) return;
  clearSplashTimers();
  progressPct.value = 100;
  proceedAfterSplash();
}

function startSplash(ms: number) {
  splashMs = ms;
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
  openOpsDirect = launchQuery.ops === '1';

  if (openOpsDirect) {
    openOps();
    return;
  }

  if (launchQuery.share === '1' || launchQuery.ref) {
    startSplash(RETURN_SPLASH_MS);
    return;
  }

  if (roleStore.isLoggedIn) {
    loggedIn.value = true;
    loggedInHint.value = '欢迎回来，即将进入首页…';
    startSplash(LOGGED_IN_SPLASH_MS);
    return;
  }

  // 首次打开：直达动画
  if (forceTour || !hasSeenTour()) {
    uni.reLaunch({ url: '/pages/common/demo-tour' });
    return;
  }

  // 回访游客：有演示身份则跳过闪屏直达首页
  const returnTarget = resolveReturnEntryPath();
  if (returnTarget !== '/pages/common/login') {
    uni.reLaunch({ url: returnTarget });
    return;
  }

  startSplash(RETURN_SPLASH_MS);
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
  background: #fff;
  color: #1a1a1a;
  padding: 0 48rpx calc(48rpx + env(safe-area-inset-bottom));
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
  width: 140rpx;
  height: 140rpx;
  border-radius: 36rpx;
  background: linear-gradient(145deg, #e88b4a 0%, #c45c26 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(196, 92, 38, 0.22);
  margin-bottom: 32rpx;
}
.logo-char {
  font-size: 68rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
.title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 4rpx;
  margin-bottom: 12rpx;
}
.tagline {
  display: block;
  font-size: 28rpx;
  color: #888;
  line-height: 1.5;
  max-width: 520rpx;
}
.version {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-primary, #c45c26);
  letter-spacing: 2rpx;
}
.welcome-hint {
  display: block;
  margin-top: 24rpx;
  font-size: 26rpx;
  color: var(--nb-primary, #c45c26);
}
.bottom {
  flex-shrink: 0;
  text-align: center;
}
.load-track {
  height: 6rpx;
  background: #f0f0f0;
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
  color: #bbb;
  margin-bottom: 20rpx;
}
.copyright {
  display: block;
  font-size: 20rpx;
  color: #ccc;
  line-height: 1.5;
}
</style>

<template>
  <view class="page">
    <image
      class="bg-img"
      :src="loginBg"
      mode="aspectFill"
    />
    <view class="bg-mask" />

    <view class="content">
    <view class="hero">
      <view class="logo-wrap">
        <text class="logo-char">暖</text>
      </view>
      <text class="title">{{ APP_TITLE }}</text>
      <text class="sub">{{ APP_TAGLINE }}</text>
    </view>

    <view class="card">
      <text class="card-label">手机号登录</text>

      <view class="field">
        <text class="field-prefix">+86</text>
        <input
          class="field-input"
          type="number"
          maxlength="11"
          :value="phone"
          placeholder="请输入手机号"
          placeholder-class="ph"
          @input="onPhoneInput"
        />
      </view>

      <view class="field code-field">
        <input
          class="field-input flex"
          type="number"
          maxlength="6"
          :value="smsCode"
          placeholder="短信验证码"
          placeholder-class="ph"
          @input="onCodeInput"
        />
        <button
          class="btn-code"
          :class="{ disabled: codeCooldown > 0 }"
          :disabled="codeCooldown > 0"
          @tap="sendCode"
        >
          {{ codeBtnText }}
        </button>
      </view>

      <button class="btn-primary" :loading="loading" @tap="onPhoneLogin">登录</button>

      <view class="divider">
        <view class="line" />
        <text class="or">或</text>
        <view class="line" />
      </view>

      <button class="btn-wx" :loading="loading" @tap="onWxLogin">
        <text class="wx-icon">微</text>
        <text>微信快捷登录（可关联）</text>
      </button>
    </view>

    <view v-if="virtualPhoneLogin" class="demo-chip" @tap="showDemoPhones">
      <text>虚拟手机登录 · 点按选择测试号</text>
    </view>

    <text class="hint">{{ loginHint }}</text>

    <view class="footer">
      <text class="foot-link" @tap="goDemoTour">动画演示</text>
      <text class="sep">·</text>
      <text class="foot-link" @tap="goAgreement">用户协议</text>
      <template v-if="virtualPhoneLogin">
        <text class="sep">·</text>
        <text class="foot-link" @tap="showDemoPhones">测试账号</text>
      </template>
      <text class="sep">·</text>
      <text class="foot-muted" @tap="showMore">更多</text>
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { loginWithPhone, loginWithWxCode, type LoginResult } from '../../api/auth';
import { APP_TAGLINE, APP_TITLE } from '../../config/brand';
import { ROLE_HOME } from '../../config/tabs';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';
import { DEMO_TEST_PHONES } from '../../utils/demo-rich-data';
import { isDemoMockEnabled } from '../../utils/demo-mock';
import { isVirtualPhoneLoginEnabled } from '../../utils/virtual-phone-login';
import loginBg from '@/static/images/login-bg-kawaii.png';

const virtualPhoneLogin = isVirtualPhoneLoginEnabled();

const loading = ref(false);
const phone = ref('');
const smsCode = ref('');
const codeCooldown = ref(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;
const fromTour = ref(false);

onLoad((query) => {
  fromTour.value = query?.from === 'tour';
  if (fromTour.value) {
    phone.value = '13800000001';
  }
});

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
});

const codeBtnText = computed(() =>
  codeCooldown.value > 0 ? `${codeCooldown.value}s` : '获取验证码',
);

const loginHint = computed(() => {
  if (fromTour.value) {
    return '动画演示结束 · 登录后首次将引导选择身份';
  }
  return virtualPhoneLogin
    ? '验证码可留空 · 点按上方测试号一键登录'
    : '首次登录将引导完善身份资料';
});

const roleStore = useRoleStore();

function showDemoPhones() {
  uni.showActionSheet({
    itemList: DEMO_TEST_PHONES.map((p) => `${p.phone.slice(-4)} · ${p.label}`),
    success: (res) => {
      const picked = DEMO_TEST_PHONES[res.tapIndex];
      if (!picked) return;
      phone.value = picked.phone;
      if (virtualPhoneLogin) void loginDemoPhone(picked.phone);
    },
  });
}

function onPhoneInput(e: { detail: { value: string } }) {
  phone.value = e.detail.value.replace(/\D/g, '').slice(0, 11);
}

function onCodeInput(e: { detail: { value: string } }) {
  smsCode.value = e.detail.value.replace(/\D/g, '').slice(0, 6);
}

function sendCode() {
  if (phone.value.length !== 11) {
    uni.showToast({ title: '请输入 11 位手机号', icon: 'none' });
    return;
  }
  if (codeCooldown.value > 0) return;
  uni.showToast({
    title: virtualPhoneLogin ? '虚拟验证码（可留空直接登录）' : '验证码已发送',
    icon: 'none',
  });
  codeCooldown.value = 60;
  cooldownTimer = setInterval(() => {
    codeCooldown.value -= 1;
    if (codeCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

function afterLogin(res: LoginResult) {
  roleStore.setAuth({
    token: res.token,
    roles: res.roles,
    activeRole: res.activeRole,
    user: res.user,
  });
  if (!res.roles.length) {
    uni.navigateTo({ url: '/pages/common/register' });
    return;
  }
  const studentRole = res.roles.find((r) => r.role === 'student');
  if (studentRole?.status === 'pending') {
    uni.reLaunch({ url: '/pages/common/student-pending' });
    return;
  }
  const activeRoles = res.roles.filter((r) => r.status === 'active');
  if (activeRoles.length > 1 && !res.activeRole) {
    uni.navigateTo({ url: '/pages/common/role-select' });
    return;
  }
  const active = res.activeRole ?? activeRoles[0]?.role;
  if (active) {
    uni.reLaunch({ url: ROLE_HOME[active] });
  } else {
    uni.navigateTo({ url: '/pages/common/register' });
  }
}

async function loginDemoPhone(demoPhone: string) {
  loading.value = true;
  try {
    const code = smsCode.value || (isDemoMockEnabled() ? '1234' : undefined);
    const res = await loginWithPhone(demoPhone, code);
    afterLogin(res);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function onPhoneLogin() {
  if (phone.value.length !== 11) {
    uni.showToast({ title: '请输入 11 位手机号', icon: 'none' });
    return;
  }
  await loginDemoPhone(phone.value);
}

async function onWxLogin() {
  loading.value = true;
  try {
    if (isDemoMockEnabled()) {
      const res = await loginWithWxCode('demo');
      afterLogin(res);
      return;
    }
    const { code } = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({ provider: 'weixin', success: resolve, fail: reject });
    });
    const res = await loginWithWxCode(code);
    afterLogin(res);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function showMore() {
  uni.showActionSheet({
    itemList: ['超级管理', '分享演示链接'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.navigateTo({ url: '/pages/common/god-view-gate' });
      } else if (res.tapIndex === 1) {
        uni.navigateTo({ url: '/pages/common/share-demo' });
      }
    },
  });
}

function goAgreement() {
  uni.navigateTo({ url: '/pages/common/agreement' });
}

function goDemoTour() {
  uni.navigateTo({ url: '/pages/common/demo-tour' });
}
</script>

<style scoped>
.page {
  position: relative;
  min-height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--nb-peach);
}

.bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bg-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(255, 248, 240, 0.08) 0%,
    rgba(255, 245, 235, 0.45) 38%,
    rgba(255, 252, 248, 0.88) 62%,
    rgba(255, 252, 248, 0.95) 100%
  );
}

.content {
  position: relative;
  z-index: 2;
  min-height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32rpx 40rpx 48rpx;
  padding-top: calc(24rpx + env(safe-area-inset-top));
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}

.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36rpx;
  padding-top: 280rpx;
}

.logo-wrap {
  width: 100rpx;
  height: 100rpx;
  border-radius: 32rpx;
  background: var(--nb-primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--nb-shadow-primary);
  margin-bottom: 28rpx;
}

.logo-char {
  font-size: 56rpx;
  font-weight: 700;
  color: #fff;
}

.title {
  font-size: 52rpx;
  font-weight: 700;
  color: var(--nb-text);
  letter-spacing: 4rpx;
  text-shadow: 0 2rpx 12rpx rgba(255, 255, 255, 0.9);
}

.sub {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: var(--nb-text-secondary);
  text-align: center;
  line-height: 1.55;
  max-width: 520rpx;
}

.card {
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28rpx;
  padding: 40rpx 36rpx 36rpx;
  box-shadow: 0 12rpx 48rpx rgba(61, 42, 31, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
}

.card-label {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--nb-text);
  margin-bottom: 28rpx;
}

.field {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
  background: var(--nb-surface-muted);
  border-radius: var(--nb-radius-md);
  border: 2rpx solid var(--nb-border);
}

.field-prefix {
  flex-shrink: 0;
  font-size: 30rpx;
  font-weight: 500;
  color: var(--nb-text);
  padding-right: 20rpx;
  margin-right: 20rpx;
  border-right: 2rpx solid var(--nb-border-light);
}

.field-input {
  flex: 1;
  height: 96rpx;
  font-size: 30rpx;
  color: var(--nb-text);
  background: transparent;
}

.field-input.flex {
  padding-left: 8rpx;
}

.code-field {
  padding-right: 12rpx;
}

.ph {
  color: var(--nb-text-placeholder);
}

.btn-code {
  flex-shrink: 0;
  margin: 0;
  padding: 0 20rpx;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: var(--nb-primary);
  background: var(--nb-surface);
  border: none;
  border-radius: var(--nb-radius-sm);
  box-shadow: 0 4rpx 12rpx rgba(196, 92, 38, 0.12);
}

.btn-code.disabled {
  color: var(--nb-text-placeholder);
  box-shadow: none;
  background: var(--nb-cream-deep);
}

.btn-primary {
  margin-top: 8rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  background: var(--nb-primary-gradient);
  border: none;
  border-radius: var(--nb-radius-pill);
  box-shadow: 0 12rpx 32rpx rgba(196, 92, 38, 0.35);
}

.btn-primary::after {
  border: none;
}

.divider {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin: 36rpx 0 28rpx;
}

.line {
  flex: 1;
  height: 2rpx;
  background: var(--nb-border);
}

.or {
  font-size: 24rpx;
  color: var(--nb-text-placeholder);
}

.btn-wx {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  margin: 0;
  font-size: 28rpx;
  color: #2d8a4e;
  background: #f0faf4;
  border: 2rpx solid #c8e6d4;
  border-radius: 44rpx;
}

.btn-wx::after {
  border: none;
}

.wx-icon {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 700;
  color: #fff;
  background: #07c160;
  border-radius: 8rpx;
}

.demo-chip {
  margin-top: 28rpx;
  padding: 16rpx 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: var(--nb-primary);
  background: rgba(255, 255, 255, 0.75);
  border: 2rpx dashed var(--nb-border-dashed);
  border-radius: 999rpx;
}

.hint {
  display: block;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
  text-align: center;
  line-height: 1.55;
  padding: 0 16rpx;
}

.footer {
  margin-top: auto;
  padding-top: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
  font-size: 26rpx;
}

.foot-link {
  color: var(--nb-primary);
}

.foot-muted {
  color: var(--nb-text-muted);
}

.sep {
  color: #ddd0c6;
}
</style>

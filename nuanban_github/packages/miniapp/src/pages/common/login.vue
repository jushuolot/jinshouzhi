<template>
  <view class="page">
    <view class="bg-blob blob-a" />
    <view class="bg-blob blob-b" />

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

    <view v-if="isDemoMockEnabled()" class="demo-chip" @tap="fillDemoPhone">
      <text>演示：13800000001 学生 · 点按填入</text>
    </view>

    <text class="hint">{{ loginHint }}</text>

    <view class="footer">
      <text class="foot-link" @tap="goDemoTour">动画演示</text>
      <text class="sep">·</text>
      <text class="foot-link" @tap="goAgreement">用户协议</text>
      <text class="sep">·</text>
      <text class="foot-muted" @tap="showMore">更多</text>
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
import { isDemoMockEnabled } from '../../utils/demo-mock';

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
  return isDemoMockEnabled()
    ? '登录后系统按身份分配权限 · 13800000002–06 对应其他演示角色'
    : '首次登录将引导完善身份资料';
});

const roleStore = useRoleStore();

function fillDemoPhone() {
  phone.value = '13800000001';
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
    title: isDemoMockEnabled() ? '演示验证码已发送（任意 4 位即可）' : '验证码已发送',
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

async function onPhoneLogin() {
  if (phone.value.length !== 11) {
    uni.showToast({ title: '请输入 11 位手机号', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const code = smsCode.value || (isDemoMockEnabled() ? '1234' : undefined);
    const res = await loginWithPhone(phone.value, code);
    afterLogin(res);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
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
    itemList: ['上帝视角', '分享演示链接'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.navigateTo({ url: '/pages/common/god-view' });
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
  min-height: 100vh;
  box-sizing: border-box;
  padding: 48rpx 40rpx 48rpx;
  padding-top: calc(48rpx + env(safe-area-inset-top));
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  background: linear-gradient(165deg, #fff8f0 0%, #ffefe0 45%, #fff5eb 100%);
  overflow: hidden;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.45;
}
.blob-a {
  width: 420rpx;
  height: 420rpx;
  top: -120rpx;
  right: -100rpx;
  background: radial-gradient(circle, rgba(232, 139, 74, 0.35), transparent 70%);
}
.blob-b {
  width: 360rpx;
  height: 360rpx;
  bottom: 80rpx;
  left: -140rpx;
  background: radial-gradient(circle, rgba(196, 92, 38, 0.2), transparent 70%);
}

.hero {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48rpx;
  padding-top: 24rpx;
}

.logo-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 32rpx;
  background: linear-gradient(145deg, #e88b4a, #c45c26);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 40rpx rgba(196, 92, 38, 0.28);
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
  color: #3d2a1f;
  letter-spacing: 4rpx;
}

.sub {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #8a7568;
  text-align: center;
  line-height: 1.55;
  max-width: 520rpx;
}

.card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.92);
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
  color: #3d2a1f;
  margin-bottom: 28rpx;
}

.field {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
  background: #faf7f4;
  border-radius: 16rpx;
  border: 2rpx solid #f0e6dc;
}

.field-prefix {
  flex-shrink: 0;
  font-size: 30rpx;
  font-weight: 500;
  color: #3d2a1f;
  padding-right: 20rpx;
  margin-right: 20rpx;
  border-right: 2rpx solid #ebe0d6;
}

.field-input {
  flex: 1;
  height: 96rpx;
  font-size: 30rpx;
  color: #3d2a1f;
  background: transparent;
}

.field-input.flex {
  padding-left: 8rpx;
}

.code-field {
  padding-right: 12rpx;
}

.ph {
  color: #b8a99e;
}

.btn-code {
  flex-shrink: 0;
  margin: 0;
  padding: 0 20rpx;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #c45c26;
  background: #fff;
  border: none;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(196, 92, 38, 0.12);
}

.btn-code.disabled {
  color: #b8a99e;
  box-shadow: none;
  background: #f5f0eb;
}

.btn-primary {
  margin-top: 8rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #e88b4a 0%, #c45c26 100%);
  border: none;
  border-radius: 48rpx;
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
  background: #f0e6dc;
}

.or {
  font-size: 24rpx;
  color: #b8a99e;
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
  position: relative;
  z-index: 1;
  margin-top: 28rpx;
  padding: 16rpx 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #c45c26;
  background: rgba(255, 255, 255, 0.75);
  border: 2rpx dashed #e8c4a8;
  border-radius: 999rpx;
}

.hint {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: #a89488;
  text-align: center;
  line-height: 1.55;
  padding: 0 16rpx;
}

.footer {
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding-top: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
  font-size: 26rpx;
}

.foot-link {
  color: #c45c26;
}

.foot-muted {
  color: #a89488;
}

.sep {
  color: #ddd0c6;
}
</style>

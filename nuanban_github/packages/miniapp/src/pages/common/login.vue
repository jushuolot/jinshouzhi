<template>
  <view class="page">
    <view class="safe-top" />
    <view class="content">
      <view class="hero">
        <view class="logo-wrap" @tap="onLogoTap">
          <text class="logo-char">暖</text>
        </view>
        <text class="title">{{ APP_TITLE }}</text>
        <text v-if="releaseBadge" class="release-badge">{{ releaseBadge }}</text>
        <text class="sub">{{ APP_TAGLINE }}</text>
      </view>

      <view class="form">
        <view class="form-row region-row">
          <text class="row-label">国家/地区</text>
          <text class="row-value">中国 +86</text>
        </view>

        <view class="form-row">
          <input
            class="row-input"
            type="number"
            maxlength="11"
            :value="phone"
            placeholder="手机号"
            placeholder-class="ph"
            aria-label="手机号"
            @input="onPhoneInput"
          />
        </view>

        <view class="form-row code-row">
          <input
            class="row-input flex"
            type="number"
            maxlength="6"
            :value="smsCode"
            placeholder="短信验证码"
            placeholder-class="ph"
            aria-label="短信验证码"
            @input="onCodeInput"
          />
          <text
            class="code-link"
            :class="{ off: codeCooldown > 0 || phone.length !== 11 }"
            @tap="sendCode"
          >
            {{ codeBtnText }}
          </text>
        </view>
        <text v-if="!formalAuth" class="demo-fill" @tap="fillDemoCode">
          开发环境万能码：{{ demoMasterCode }}
        </text>

        <AgreementRow
          :model-value="agreed"
          @update:model-value="onAgreedChange"
          @open-agreement="goAgreement"
          @open-privacy="goPrivacy"
        />

        <view
          class="btn-submit"
          :class="{ ready: agreed, loading }"
          @tap="onPhoneLogin"
        >
          <text v-if="loading">登录中…</text>
          <text v-else>登录 / 注册</text>
        </view>
      </view>

      <text v-if="loginHint" class="hint">{{ loginHint }}</text>
      <text v-if="!formalAuth" class="hint sms-hint">
        获取验证码前需完成安全验证
      </text>
      <text v-if="!formalAuth" class="hint account-hint">
        一个手机号对应一个账号。该号已注册过请直接登录；要体验全新注册请换手机号。
      </text>
      <text v-if="!formalAuth" class="switch-link" @tap="switchAccount">换手机号登录 / 注册新账号</text>

      <CaptchaPicker :visible="captchaVisible" @verified="onCaptchaVerified" @cancel="captchaVisible = false" />

      <view v-if="formalAuth" class="footer">
        <text class="foot-link subtle" @tap="switchAccount">切换账号</text>
      </view>
      <view v-else class="footer">
        <text class="foot-link" @tap="goDemoTour">动画演示</text>
        <text class="sep">|</text>
        <text class="foot-link" @tap="goGuest">游客账号</text>
      </view>
    </view>
    <OpsSessionBar />
  </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { loginWithPhone, type LoginResult } from '../../api/auth';
import { APP_TAGLINE, APP_TITLE } from '../../config/brand';
import { isFormalAuthMode } from '../../config/formal-auth';
import { releaseLabel } from '../../config/release';
import { navigateAfterAuth } from '../../utils/profile-onboarding';
import { routeStudentAfterAuth } from '../../utils/student-auth-route';
import { exitGuestBrowse } from '../../utils/guest-browse';
import { isUserManualAccepted, markRegistrationConsent } from '../../utils/user-manual';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';
import AgreementRow from '../../components/AgreementRow.vue';
import CaptchaPicker from '../../components/CaptchaPicker.vue';
import OpsSessionBar from '../../components/OpsSessionBar.vue';
import { sendSelfHostedSms } from '../../api/captcha-sms';
import { openOpsMode } from '../../utils/ops-mode';

const loading = ref(false);
const phone = ref('');
const smsCode = ref('');
const codeCooldown = ref(0);
const agreed = ref(isUserManualAccepted());
const fromTour = ref(false);
const fromGuest = ref(false);
const captchaVisible = ref(false);
const demoMasterCode = '000000';
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const roleStore = useRoleStore();
const releaseBadge = releaseLabel();
const formalAuth = isFormalAuthMode();

onLoad((query) => {
  fromTour.value = query?.from === 'tour';
  fromGuest.value = query?.from === 'guest';
  agreed.value = isUserManualAccepted();
  if (roleStore.isLoggedIn) {
    void redirectLoggedIn();
  }
});

function onAgreedChange(val: boolean) {
  agreed.value = val;
  if (val) markRegistrationConsent();
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
});

const codeBtnText = computed(() =>
  codeCooldown.value > 0 ? `${codeCooldown.value}s` : '获取验证码',
);


function fillDemoCode() {
  smsCode.value = demoMasterCode;
  uni.showToast({ title: '已填入演示验证码', icon: 'none' });
}

const canSubmit = computed(
  () => phone.value.length === 11 && smsCode.value.length === 6 && !loading.value && agreed.value,
);

const loginHint = computed(() => {
  if (fromGuest.value) return '注册登录后可正式下单';
  if (fromTour.value) return '看完动画了？登录或选择游客账号继续体验';
  return '';
});

async function redirectLoggedIn() {
  const roles = roleStore.activeRoles.filter((r) => r.status === 'active');
  if (roles.length > 1 && !roleStore.activeRole) {
    uni.reLaunch({ url: '/pages/common/role-select' });
    return;
  }
  const active = roleStore.activeRole ?? roles[0]?.role;
  if (active) await navigateAfterAuth(active);
  else uni.reLaunch({ url: '/pages/common/register' });
}

function onPhoneInput(e: { detail: { value: string } }) {
  phone.value = e.detail.value.replace(/\D/g, '').slice(0, 11);
}

function onCodeInput(e: { detail: { value: string } }) {
  smsCode.value = e.detail.value.replace(/\D/g, '').slice(0, 6);
}

function startCooldown() {
  codeCooldown.value = 60;
  cooldownTimer = setInterval(() => {
    codeCooldown.value -= 1;
    if (codeCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

function sendCode() {
  if (phone.value.length !== 11) {
    uni.showToast({ title: '请输入 11 位手机号', icon: 'none' });
    return;
  }
  if (codeCooldown.value > 0) return;
  captchaVisible.value = true;
}

async function onCaptchaVerified(token: string) {
  captchaVisible.value = false;
  try {
    const res = await sendSelfHostedSms(phone.value, token);
    if (res.devCode && !formalAuth) {
      smsCode.value = res.devCode;
      uni.showModal({
        title: '开发环境验证码',
        content: `验证码：${res.devCode}\n（已自动填入，生产环境请查运营发件箱）`,
        showCancel: false,
      });
    } else if (formalAuth) {
      uni.showToast({ title: '验证码已发送，请查收短信', icon: 'none' });
    } else {
      uni.showToast({ title: res.message || '验证码已发出', icon: 'none' });
    }
    startCooldown();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

function ensureAgreed(): boolean {
  if (agreed.value) return true;
  uni.showToast({ title: '请先同意用户协议与隐私政策', icon: 'none' });
  return false;
}

function afterLogin(res: LoginResult) {
  exitGuestBrowse();
  roleStore.setAuth({
    token: res.token,
    roles: res.roles,
    activeRole: res.activeRole,
    user: res.user,
  });
  if (!res.roles.length) {
    uni.reLaunch({ url: '/pages/common/register' });
    return;
  }
  const awaitingStudent = res.roles.find(
    (r) => r.role === 'student' && (r.status === 'pending' || r.status === 'rejected'),
  );
  if (awaitingStudent) {
    uni.reLaunch({ url: '/pages/common/student-pending' });
    return;
  }
  const studentRole = res.roles.find((r) => r.role === 'student');
  if (studentRole && res.roles.length === 1) {
    void routeStudentAfterAuth(res);
    return;
  }
  const activeRoles = res.roles.filter((r) => r.status === 'active');
  if (activeRoles.length > 1 && !res.activeRole) {
    uni.navigateTo({ url: '/pages/common/role-select' });
    return;
  }
  const active = res.activeRole ?? activeRoles[0]?.role;
  if (active === 'student') {
    void routeStudentAfterAuth(res);
    return;
  }
  if (active) {
    roleStore.setActiveRole(active);
    void navigateAfterAuth(active);
  } else if (res.roles.length === 1) {
    const only = res.roles[0].role;
    roleStore.setActiveRole(only);
    if (only === 'student') {
      void routeStudentAfterAuth(res);
    } else {
      void navigateAfterAuth(only);
    }
  } else {
    uni.reLaunch({ url: '/pages/common/register' });
  }
}

async function onPhoneLogin() {
  if (!ensureAgreed()) return;
  if (phone.value.length !== 11) {
    uni.showToast({ title: '请输入 11 位手机号', icon: 'none' });
    return;
  }
  if (smsCode.value.length !== 6) {
    uni.showToast({ title: '请输入 6 位验证码', icon: 'none' });
    return;
  }
  if (!canSubmit.value || loading.value) return;
  loading.value = true;
  try {
    const res = await loginWithPhone(phone.value, smsCode.value);
    afterLogin(res);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function onLogoTap() {
  openOpsMode();
}

function goAgreement() {
  uni.navigateTo({ url: '/pages/common/agreement' });
}

function goPrivacy() {
  uni.navigateTo({ url: '/pages/common/privacy-policy' });
}

function goDemoTour() {
  uni.reLaunch({ url: '/pages/common/demo-tour' });
}

function goGuest() {
  uni.navigateTo({ url: '/pages/common/guest-role-pick' });
}

function switchAccount() {
  roleStore.logout();
  phone.value = '';
  smsCode.value = '';
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
  box-sizing: border-box;
}
.safe-top {
  height: env(safe-area-inset-top);
}
.content {
  min-height: calc(100dvh - env(safe-area-inset-top));
  box-sizing: border-box;
  padding: 40rpx 56rpx calc(32rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 64rpx;
  padding-top: 16rpx;
}
.logo-wrap {
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  background: var(--nb-primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}
.logo-wrap:active {
  opacity: 0.88;
}
.logo-char {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 2rpx;
}
.release-badge {
  margin-top: 10rpx;
  padding: 2rpx 14rpx;
  font-size: 20rpx;
  color: #888;
  border: 1rpx solid #e8e8e8;
  border-radius: 6rpx;
}
.sub {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #999;
  text-align: center;
  line-height: 1.55;
  max-width: 560rpx;
}
.form {
  flex-shrink: 0;
}
.form-row {
  display: flex;
  align-items: center;
  min-height: 100rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.region-row {
  justify-content: space-between;
}
.row-label {
  font-size: 30rpx;
  color: #1a1a1a;
}
.row-value {
  font-size: 30rpx;
  color: #333;
}
.row-input {
  flex: 1;
  height: 88rpx;
  font-size: 32rpx;
  color: #1a1a1a;
}
.row-input.flex {
  min-width: 0;
}
.ph {
  color: #c8c8c8;
}
.code-row {
  padding-right: 0;
}
.code-link {
  flex-shrink: 0;
  font-size: 28rpx;
  color: #c45c26;
  padding: 12rpx 0 12rpx 16rpx;
}
.code-link.off {
  color: #c8c8c8;
}
.btn-submit {
  margin-top: 32rpx;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  border-radius: 48rpx;
  background: #e0e0e0;
}
.btn-submit.ready {
  background: linear-gradient(135deg, #e88b4a, #c45c26);
  box-shadow: 0 8rpx 24rpx rgba(196, 92, 38, 0.28);
}
.btn-submit.ready:active {
  opacity: 0.92;
}
.btn-submit.loading {
  opacity: 0.75;
}
.hint {
  display: block;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #aaa;
  text-align: center;
  line-height: 1.5;
}
.sms-hint {
  margin-top: 12rpx;
  font-size: 22rpx;
}
.account-hint {
  margin-top: 20rpx;
  padding: 0 8rpx;
  font-size: 22rpx;
  color: #888;
}
.switch-link {
  display: block;
  margin-top: 12rpx;
  text-align: center;
  font-size: 26rpx;
  color: #c45c26;
}
.demo-fill {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #c45c26;
  text-align: center;
}
.footer {
  margin-top: auto;
  padding-top: 32rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20rpx;
  font-size: 26rpx;
}
.foot-link {
  color: #c45c26;
}
.foot-link.subtle {
  font-size: 24rpx;
  color: #999;
}
.sep {
  color: #e0e0e0;
}
</style>

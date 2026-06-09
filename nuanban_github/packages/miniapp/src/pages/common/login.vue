<template>
  <view class="page">
    <view v-if="showVisitorBanner" class="visitor-banner" @tap="goDemoTour">
      <text class="banner-icon">🎬</text>
      <view class="banner-body">
        <text class="banner-title">新访客？先看 22 秒动画演示</text>
        <text class="banner-sub">三种撮合路径 · 无需登录</text>
      </view>
      <text class="banner-cta">观看 →</text>
    </view>
    <text class="title">{{ APP_TITLE }}</text>
    <text class="sub">{{ APP_TAGLINE }}</text>

    <view class="form">
      <input
        class="input"
        type="number"
        maxlength="11"
        :value="phone"
        placeholder="请输入手机号"
        @input="onPhoneInput"
      />
      <view class="code-row">
        <input
          class="input code"
          type="number"
          maxlength="6"
          :value="smsCode"
          placeholder="短信验证码"
          @input="onCodeInput"
        />
        <button class="btn-code" :disabled="codeCooldown > 0" @tap="sendCode">
          {{ codeBtnText }}
        </button>
      </view>
      <button class="btn-primary" :loading="loading" @tap="onPhoneLogin">登录</button>
    </view>

    <text class="wx-link" @tap="onWxLogin">微信快捷登录（可关联）</text>

    <view class="hint">{{ loginHint }}</view>
    <view class="links">
      <text @tap="goRegister('elder')">老人注册</text>
      <text @tap="goRegister('family')">家属注册</text>
      <text @tap="goRegister('student')">学生注册</text>
    </view>
    <view class="links secondary">
      <text @tap="showDevPicker">演示账号</text>
      <text @tap="goDemoTour">动画演示</text>
      <text @tap="goGodView">上帝视角</text>
      <text @tap="goShareDemo">分享链接</text>
      <text @tap="goAgreement">用户协议</text>
    </view>
    <view class="links tertiary">
      <text @tap="goAdminHub">运营演示</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { loginDev, loginWithPhone, loginWithWxCode, type LoginResult } from '../../api/auth';
import { APP_TAGLINE, APP_TITLE } from '../../config/brand';
import { ROLE_HOME, type RoleKey } from '../../config/tabs';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';
import { isDemoMockEnabled } from '../../utils/demo-mock';

const loading = ref(false);
const phone = ref('');
const smsCode = ref('');
const codeCooldown = ref(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;
const fromTour = ref(false);
const showVisitorBanner = computed(() => isDemoMockEnabled() && !fromTour.value);

onLoad((query) => {
  fromTour.value = query?.from === 'tour' || query?.hint === 'student1';
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
    return '动画演示结束 · 手机号 13800000001 可体验学生主流程（验证码任意 4 位）';
  }
  return isDemoMockEnabled()
    ? '公网演示 · 任意 11 位手机号可登录 · 13800000001–06 对应不同演示角色'
    : '本地联调：演示号 13800000001–06 映射 seed 账号；须先 seed-demo';
});
const roleStore = useRoleStore();

const DEV_ACCOUNTS = [
  { label: '学生', email: 'student1@test.nuanban.dev' },
  { label: '学生2', email: 'student2@test.nuanban.dev' },
  { label: '学生3(审核中)', email: 'student3@test.nuanban.dev' },
  { label: '家属', email: 'family1@test.nuanban.dev' },
  { label: '老人', email: 'elder1@test.nuanban.dev' },
  { label: '多角色', email: 'multi1@test.nuanban.dev' },
] as const;

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

function showDemoWxRolePicker() {
  uni.showActionSheet({
    itemList: ['学生（林同学）', '家属', '老人'],
    success: async (res) => {
      const roles: RoleKey[] = ['student', 'family', 'elder'];
      loading.value = true;
      try {
        const pick = roles[res.tapIndex];
        const result = await loginWithWxCode('demo', pick);
        afterLogin(result);
      } catch (e) {
        uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
      } finally {
        loading.value = false;
      }
    },
  });
}

async function onWxLogin() {
  if (isDemoMockEnabled()) {
    uni.showModal({
      title: '关联微信（演示）',
      content: '演示模式模拟微信授权，可关联已有账号或新建。请选择：',
      confirmText: '关联学生账号',
      cancelText: '选择身份',
      success: async (res) => {
        if (res.confirm) {
          await onDevLogin('student1@test.nuanban.dev');
        } else if (res.cancel) {
          showDemoWxRolePicker();
        }
      },
    });
    return;
  }
  loading.value = true;
  try {
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

function showDevPicker() {
  uni.showActionSheet({
    itemList: DEV_ACCOUNTS.map((d) => d.label),
    success: (res) => {
      const dev = DEV_ACCOUNTS[res.tapIndex];
      if (dev) onDevLogin(dev.email);
    },
  });
}

async function onDevLogin(email: string) {
  loading.value = true;
  try {
    const res = await loginDev(email);
    afterLogin(res);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goRegister(role: RoleKey) {
  uni.navigateTo({ url: `/pages/common/register?role=${role}` });
}

function goAgreement() {
  uni.navigateTo({ url: '/pages/common/agreement' });
}

function goAdminHub() {
  uni.navigateTo({ url: '/pages/common/admin-hub' });
}

function goGodView() {
  uni.navigateTo({ url: '/pages/common/god-view' });
}

function goShareDemo() {
  uni.navigateTo({ url: '/pages/common/share-demo' });
}

function goDemoTour() {
  uni.navigateTo({ url: '/pages/common/demo-tour' });
}
</script>

<style scoped>
.page {
  padding: 80rpx 48rpx;
}
.visitor-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: linear-gradient(135deg, #fff8f0, #fff);
  border: 2rpx solid #e88b4a;
  border-radius: 16rpx;
  padding: 24rpx 20rpx;
  margin-bottom: 32rpx;
}
.banner-icon {
  font-size: 40rpx;
}
.banner-body {
  flex: 1;
}
.banner-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #c45c26;
}
.banner-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #888;
}
.banner-cta {
  font-size: 26rpx;
  color: #e88b4a;
}
.title {
  font-size: 48rpx;
  font-weight: 600;
  color: #c45c26;
}
.sub {
  display: block;
  margin: 16rpx 0 48rpx;
  color: #666;
  font-size: 28rpx;
}
.form {
  margin-bottom: 24rpx;
}
.input {
  width: 100%;
  box-sizing: border-box;
  height: 88rpx;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
  border: 1px solid #e0d5cc;
  border-radius: 12rpx;
  font-size: 30rpx;
  background: #fff;
}
.code-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.input.code {
  flex: 1;
  margin-bottom: 0;
}
.btn-code {
  flex-shrink: 0;
  width: 220rpx;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0;
  font-size: 26rpx;
  color: #c45c26;
  background: #fff;
  border: 1px solid #c45c26;
  border-radius: 12rpx;
}
.btn-code[disabled] {
  color: #aaa;
  border-color: #ddd;
}
.btn-primary {
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
.wx-link {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: #888;
  margin-bottom: 8rpx;
}
.hint {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #888;
  text-align: center;
}
.links {
  margin-top: 48rpx;
  display: flex;
  justify-content: space-between;
  color: #c45c26;
  font-size: 28rpx;
}
.links.secondary {
  margin-top: 24rpx;
  justify-content: center;
  gap: 32rpx;
  flex-wrap: wrap;
}
.links.tertiary {
  margin-top: 16rpx;
  justify-content: center;
  color: #c45c26;
  font-size: 28rpx;
}
</style>

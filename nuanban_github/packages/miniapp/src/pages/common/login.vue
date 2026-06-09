<template>
  <view class="page">
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
    <view class="footer">
      <text @tap="goDemoTour">动画演示</text>
      <text class="sep">·</text>
      <text @tap="goAgreement">用户协议</text>
      <text class="sep">·</text>
      <text class="more" @tap="showMore">更多</text>
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
    return '动画演示结束 · 直接登录，首次将引导选择身份';
  }
  return isDemoMockEnabled()
    ? '登录后选择身份 · 系统按设定分配角色与权限 · 演示号 13800000001–06'
    : '手机号登录 · 首次使用将引导完善身份资料';
});

const roleStore = useRoleStore();

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
  padding: 120rpx 48rpx 80rpx;
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.title {
  font-size: 52rpx;
  font-weight: 600;
  color: #c45c26;
  text-align: center;
}
.sub {
  display: block;
  margin: 20rpx 0 64rpx;
  color: #666;
  font-size: 28rpx;
  text-align: center;
  line-height: 1.5;
}
.form {
  margin-bottom: 16rpx;
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
  font-size: 32rpx;
  padding: 8rpx 0;
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
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #888;
  text-align: center;
  line-height: 1.5;
}
.footer {
  margin-top: auto;
  padding-top: 64rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
  font-size: 26rpx;
  color: #c45c26;
}
.sep {
  color: #ccc;
}
.more {
  color: #999;
}
</style>

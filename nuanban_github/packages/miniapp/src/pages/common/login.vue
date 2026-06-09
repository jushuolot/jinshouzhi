<template>
  <view class="page">
    <text class="title">暖伴勤工</text>
    <text class="sub">附近中老年 ↔ 在校女大学生 · 有偿陪护匹配</text>
    <button class="btn-primary" :loading="loading" @tap="onLogin">登录</button>
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
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { loginWithWxCode } from '../../api/auth';
import { ROLE_HOME } from '../../config/tabs';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';
import { isDemoMockEnabled } from '../../utils/demo-mock';

const loading = ref(false);
const fromTour = ref(false);

onLoad((query) => {
  fromTour.value = query?.from === 'tour';
});

const loginHint = computed(() => {
  if (fromTour.value) {
    return '动画演示结束 · 登录后选择身份，系统为您分配权限与首页';
  }
  return isDemoMockEnabled()
    ? '登录后选择身份 · 系统按设定分配角色与权限'
    : '微信授权登录 · 首次使用将引导完善身份资料';
});

const roleStore = useRoleStore();

function afterLogin(res: Awaited<ReturnType<typeof loginWithWxCode>>) {
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

async function onLogin() {
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
  margin: 20rpx 0 100rpx;
  color: #666;
  font-size: 28rpx;
  text-align: center;
  line-height: 1.5;
}
.btn-primary {
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
  font-size: 32rpx;
  padding: 8rpx 0;
}
.hint {
  display: block;
  margin-top: 32rpx;
  font-size: 24rpx;
  color: #888;
  text-align: center;
  line-height: 1.5;
}
.footer {
  margin-top: auto;
  padding-top: 80rpx;
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

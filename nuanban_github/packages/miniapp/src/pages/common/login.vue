<template>
  <view class="page">
    <text class="title">暖伴勤工</text>
    <text class="sub">附近中老年 ↔ 在校女大学生 · 有偿陪护匹配</text>
    <button class="btn-primary" :loading="loading" @tap="onWxLogin">微信登录</button>
    <button
      v-for="dev in DEV_ACCOUNTS"
      :key="dev.email"
      class="btn-secondary"
      :loading="loading"
      @tap="onDevLogin(dev.email)"
    >
      开发登录（{{ dev.label }}）
    </button>
    <view class="hint">{{ loginHint }}</view>
    <view class="links">
      <text @tap="goRegister('elder')">老人注册</text>
      <text @tap="goRegister('family')">家属注册</text>
      <text @tap="goRegister('student')">学生注册</text>
    </view>
    <view class="links secondary">
      <text @tap="goDemoTour">动画演示</text>
      <text @tap="goGodView">上帝视角</text>
      <text @tap="goAgreement">用户协议</text>
    </view>
    <view class="links tertiary">
      <text @tap="goAdminHub">运营演示</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { loginDev, loginWithWxCode } from '../../api/auth';
import { ROLE_HOME, type RoleKey } from '../../config/tabs';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';
import { isDemoMockEnabled } from '../../utils/demo-mock';

const loading = ref(false);
const fromTour = ref(false);

onLoad((query) => {
  fromTour.value = query?.from === 'tour' || query?.hint === 'student1';
});

const loginHint = computed(() => {
  if (fromTour.value) {
    return '动画演示结束 · 请点「开发登录（学生）」用 student1 体验待接单 → 完成 → 收入';
  }
  return isDemoMockEnabled()
    ? '公网演示 · 微信登录可走演示流程 · 富数据集零成本 Mock'
    : '本地联调：先 seed-demo；富数据支持列表与压力场景测试';
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
      title: '微信登录（演示）',
      content: '演示模式模拟微信授权，不产生真实商户登录。请选择登录方式：',
      confirmText: '快速登录学生',
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

function goDemoTour() {
  uni.navigateTo({ url: '/pages/common/demo-tour' });
}
</script>

<style scoped>
.page {
  padding: 80rpx 48rpx;
}
.title {
  font-size: 48rpx;
  font-weight: 600;
  color: #c45c26;
}
.sub {
  display: block;
  margin: 16rpx 0 80rpx;
  color: #666;
}
.btn-primary {
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}
.btn-secondary {
  background: #fff;
  color: #c45c26;
  border: 1px solid #c45c26;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
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

<template>
  <view class="page nb-page-padded">
    <template v-if="step === 'pick'">
      <text class="title">选择您的身份</text>
      <text class="sub">系统将根据身份分配功能与权限，多身份可在登录后切换</text>
      <view
        v-for="opt in roleOptions"
        :key="opt.key"
        class="card nb-card nb-card-interactive"
        @tap="pickRole(opt.key)"
      >
        <text class="card-title">{{ opt.label }}</text>
        <text class="card-desc">{{ opt.desc }}</text>
      </view>
      <text class="back" @tap="goLogin">返回登录</text>
    </template>
    <template v-else>
      <text class="title">完善资料 · {{ roleLabel[role] }}</text>
      <input v-model="displayName" class="input nb-input" placeholder="显示名称（可选）" />
      <button class="btn-primary nb-btn-primary" :loading="loading" @tap="submit">确认身份</button>
      <text class="back" @tap="step = 'pick'">重新选择身份</text>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { registerRole } from '../../api/auth';
import { ROLE_HOME, type RoleKey } from '../../config/tabs';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';

const role = ref<RoleKey>('student');
const displayName = ref('');
const loading = ref(false);
const step = ref<'pick' | 'form'>('pick');
const roleStore = useRoleStore();

const roleLabel: Record<RoleKey, string> = {
  elder: '老人',
  family: '家属',
  student: '学生',
};

const roleOptions = [
  { key: 'student' as RoleKey, label: '我是学生', desc: '在校女大学生 · 接单陪护 · 收入结算' },
  { key: 'family' as RoleKey, label: '我是家属', desc: '绑定老人 · 代付订单 · 外出审批' },
  { key: 'elder' as RoleKey, label: '我是老人', desc: '找附近同学 · 预约陪护 · 一键求助' },
];

onLoad((q) => {
  if (!roleStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/common/login' });
    return;
  }
  if (roleStore.activeRoles.length > 0) {
    if (roleStore.hasMultipleRoles) {
      uni.reLaunch({ url: '/pages/common/role-select' });
    } else {
      const r = roleStore.activeRoles[0]?.role;
      if (r) uni.reLaunch({ url: ROLE_HOME[r] });
    }
    return;
  }
  if (q?.role) {
    role.value = q.role as RoleKey;
    step.value = 'form';
  }
});

function pickRole(r: RoleKey) {
  role.value = r;
  step.value = 'form';
}

function goLogin() {
  uni.reLaunch({ url: '/pages/common/login' });
}

async function submit() {
  loading.value = true;
  try {
    const roles = await registerRole(role.value, displayName.value || undefined);
    roleStore.setAuth({
      token: roleStore.token,
      roles,
      user: roleStore.user ?? undefined,
      activeRole: role.value,
    });
    const studentRole = roles.find((r) => r.role === 'student');
    if (role.value === 'student' && studentRole?.status === 'pending') {
      uni.showToast({ title: '已提交，等待审核', icon: 'none' });
      uni.reLaunch({ url: '/pages/common/student-pending' });
      return;
    }
    uni.showToast({ title: '身份已设定', icon: 'success' });
    uni.reLaunch({ url: ROLE_HOME[role.value] });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.sub {
  display: block;
  margin: 16rpx 0 40rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
  line-height: 1.5;
}
.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-primary);
}
.card-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
  line-height: 1.5;
}
.input {
  margin: 32rpx 0 24rpx;
}
.btn-primary {
  margin-top: 24rpx;
}
.back {
  display: block;
  margin-top: 40rpx;
  text-align: center;
  color: var(--nb-primary);
  font-size: 28rpx;
}
</style>

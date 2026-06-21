<template>
  <view class="page nb-page-onboard">
    <AuthBrandHeader compact subtitle="请选择当前使用身份" />
    <view
      v-for="r in roleStore.activeRoles"
      :key="r.role"
      class="card nb-card nb-card-interactive nb-tile"
      :class="{ selecting: selecting === r.role }"
      @tap="select(r.role)"
    >
      <text class="role-icon">{{ roleIcon[r.role] }}</text>
      <text class="card-label">{{ roleLabel[r.role] }}</text>
      <text class="card-desc">{{ roleDesc[r.role] }}</text>
    </view>
    <view v-if="selecting" class="nb-loading-hint">
      <view class="nb-loading-dot" />
      <text>正在进入…</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AuthBrandHeader from '../../components/AuthBrandHeader.vue';
import type { RoleKey } from '../../config/tabs';
import { navigateAfterAuth } from '../../utils/profile-onboarding';
import { useRoleStore } from '../../store/role';

const roleStore = useRoleStore();
const selecting = ref<RoleKey | ''>('');

const roleLabel: Record<RoleKey, string> = {
  elder: '我是老人',
  family: '我是家属',
  student: '我是学生',
};

const roleIcon: Record<RoleKey, string> = {
  elder: '🌸',
  family: '👨‍👩‍👧',
  student: '🎓',
};

const roleDesc: Record<RoleKey, string> = {
  elder: '找陪护、储值卡、一键求助',
  family: '代付订单、外出审批、绑定老人',
  student: '接单服务、收入提现、附近老人',
};

async function select(role: RoleKey) {
  if (selecting.value) return;
  selecting.value = role;
  const studentRole = roleStore.roles.find((r) => r.role === 'student');
  if (role === 'student' && (studentRole?.status === 'pending' || studentRole?.status === 'rejected')) {
    uni.reLaunch({ url: '/pages/common/student-pending' });
    return;
  }
  roleStore.setAuth({
    token: roleStore.token,
    roles: roleStore.roles,
    activeRole: role,
    user: roleStore.user ?? undefined,
  });
  void navigateAfterAuth(role);
  selecting.value = '';
}
</script>

<style scoped>
.role-icon {
  display: block;
  font-size: 44rpx;
  margin-bottom: 8rpx;
}
.card-label {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-primary);
}
.card-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
  line-height: 1.45;
}
.card.selecting {
  border-color: var(--nb-primary);
  background: var(--nb-primary-soft);
}
</style>

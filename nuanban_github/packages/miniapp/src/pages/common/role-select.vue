<template>
  <view class="page nb-page-onboard">
    <AuthBrandHeader compact subtitle="请选择当前使用身份" />
    <view
      v-for="r in roleStore.activeRoles"
      :key="r.role"
      class="card nb-card nb-card-interactive"
      @tap="select(r.role)"
    >
      <text class="role-icon">{{ roleIcon[r.role] }}</text>
      <text class="card-label">{{ roleLabel[r.role] }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import AuthBrandHeader from '../../components/AuthBrandHeader.vue';
import type { RoleKey } from '../../config/tabs';
import { navigateAfterAuth } from '../../utils/profile-onboarding';
import { useRoleStore } from '../../store/role';

const roleStore = useRoleStore();
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

async function select(role: RoleKey) {
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
</style>

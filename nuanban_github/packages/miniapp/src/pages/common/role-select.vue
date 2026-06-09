<template>
  <view class="page nb-page-padded">
    <text class="title">请选择使用身份</text>
    <text class="sub">可随时在「我的」中切换身份</text>
    <view
      v-for="r in roleStore.activeRoles"
      :key="r.role"
      class="card nb-card nb-card-interactive"
      @tap="select(r.role)"
    >
      <text class="card-label">{{ roleLabel[r.role] }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ROLE_HOME, type RoleKey } from '../../config/tabs';
import { useRoleStore } from '../../store/role';

const roleStore = useRoleStore();
const roleLabel: Record<RoleKey, string> = {
  elder: '我是老人',
  family: '我是家属',
  student: '我是学生',
};

async function select(role: RoleKey) {
  const studentRole = roleStore.roles.find((r) => r.role === 'student');
  if (role === 'student' && studentRole?.status === 'pending') {
    uni.reLaunch({ url: '/pages/common/student-pending' });
    return;
  }
  roleStore.setAuth({
    token: roleStore.token,
    roles: roleStore.roles,
    activeRole: role,
    user: roleStore.user ?? undefined,
  });
  uni.reLaunch({ url: ROLE_HOME[role] });
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
  margin: 12rpx 0 32rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
}
.card-label {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-primary);
}
</style>

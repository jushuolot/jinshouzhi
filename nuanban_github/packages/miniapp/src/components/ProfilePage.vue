<template>
  <view class="page" :class="{ 'elder-mode': role === 'elder', [elderFontCls]: role === 'elder' }">
    <view class="hero">
      <ProfileAvatar
        class="hero-avatar"
        :avatar-url="avatarUrl"
        :name="displayName"
        @change="onAvatarChange"
      />
      <view class="hero-info">
        <text class="name">{{ displayName }}</text>
        <text class="tag">{{ roleLabel }}</text>
        <text v-if="subLine" class="sub">{{ subLine }}</text>
      </view>
    </view>

    <view class="stats-card">
      <view v-for="(item, idx) in statItems" :key="item.label" class="stat-wrap">
        <view v-if="idx > 0" class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num" :class="{ accent: item.accent }">{{ item.value }}</text>
          <text class="stat-label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <ProfileDetailCard v-if="detailSections.length" :sections="detailSections" />

    <view class="menu-card">
      <view
        v-for="item in menuItems"
        :key="item.label"
        class="menu-item"
        :class="{ highlight: item.highlight }"
        @tap="item.action"
      >
        <text>{{ item.label }}</text>
        <text v-if="item.badge" class="menu-tag">{{ item.badge }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view v-if="role === 'elder'" class="action-footer">
      <button class="btn-outline elder-relogin" @tap="reLogin">重新登录</button>
    </view>
    <template v-else>
      <button class="btn-outline" @tap="goLogin">切换账号 / 重新登录</button>
      <button class="btn-danger" @tap="logout">退出登录</button>
    </template>
    <RoleTabBar v-if="role" :role="role" :current="currentTab" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from './RoleTabBar.vue';
import ProfileAvatar from './ProfileAvatar.vue';
import ProfileDetailCard, { type ProfileDetailSection } from './ProfileDetailCard.vue';
import { fetchFamilyStats, fetchFamilyProfile, type FamilyProfile } from '../api/family';
import { fetchElderStats, fetchElderSelfProfile, type ElderSelfProfile } from '../api/elder';
import { fetchElderWallet, fetchFamilyWallet } from '../api/wallet';
import { listBoundElders, listPendingPaymentOrders } from '../api/family';
import { useRoleStore } from '../store/role';
import { elderFontClass } from '../utils/elder-accessibility';
import { pbErrorMessage } from '../utils/request';
import type { RoleKey } from '../config/tabs';

const props = defineProps<{ role: RoleKey; currentTab: string }>();
const roleStore = useRoleStore();
const elderFontCls = ref(elderFontClass());

const familyStats = ref<{ boundElderCount: number; pendingPaymentCount: number; paidTotalYuan: string } | null>(null);
const elderStats = ref<{ elderName: string; orderCount: number; activeCount: number } | null>(null);
const familyProfile = ref<FamilyProfile | null>(null);
const elderProfile = ref<ElderSelfProfile | null>(null);
const walletBalanceYuan = ref('0.00');

const roleLabel = computed(() => {
  const map: Record<RoleKey, string> = { student: '家属', family: '家属', elder: '老人' };
  if (props.role === 'student') return '学生';
  return map[props.role];
});

const displayName = computed(() => {
  if (props.role === 'elder' && elderProfile.value?.name) return elderProfile.value.name;
  if (props.role === 'family' && familyProfile.value?.nickname) return familyProfile.value.nickname;
  if (props.role === 'elder' && elderStats.value?.elderName) return elderStats.value.elderName;
  return roleStore.user?.nickname || '演示用户';
});

const avatarUrl = computed(() => {
  if (props.role === 'family') return familyProfile.value?.avatarUrl;
  if (props.role === 'elder') return elderProfile.value?.avatarUrl;
  return roleStore.user?.avatarUrl;
});

function onAvatarChange(url: string) {
  if (props.role === 'family' && familyProfile.value) {
    familyProfile.value = { ...familyProfile.value, avatarUrl: url };
  } else if (props.role === 'elder' && elderProfile.value) {
    elderProfile.value = { ...elderProfile.value, avatarUrl: url };
  }
}

const subLine = computed(() => {
  if (props.role === 'family') {
    const linked = familyProfile.value?.linkedElderName;
    return linked ? `照护 ${linked}（${familyProfile.value?.relationToElder || '家属'}）` : `绑定老人 ${familyStats.value?.boundElderCount ?? 0} 位`;
  }
  if (props.role === 'elder') return elderProfile.value?.orgName || '暖伴示范养老院';
  return '';
});

const statItems = computed(() => {
  if (props.role === 'family') {
    return [
      { label: '绑定老人', value: String(familyStats.value?.boundElderCount ?? 0), accent: false },
      { label: '待支付', value: String(familyStats.value?.pendingPaymentCount ?? 0), accent: true },
      { label: '累计代付', value: `¥${familyStats.value?.paidTotalYuan ?? '0.00'}`, accent: false },
    ];
  }
  if (props.role === 'elder') {
    return [
      { label: '我的订单', value: String(elderStats.value?.orderCount ?? 0), accent: false },
      { label: '进行中', value: String(elderStats.value?.activeCount ?? 0), accent: true },
      { label: '档案', value: elderStats.value?.elderName ? '已绑定' : '未绑定', accent: false },
    ];
  }
  return [];
});

const detailSections = computed((): ProfileDetailSection[] => {
  if (props.role === 'family' && familyProfile.value) {
    const p = familyProfile.value;
    return [
      {
        title: '联系信息',
        rows: [
          { label: '邮箱', value: p.email },
          { label: '联系电话', value: p.contactPhone },
          { label: '所在区域', value: p.district },
          { label: '联系地址', value: p.address },
        ],
      },
      {
        title: '照护关系',
        rows: [
          { label: '绑定老人', value: p.linkedElderName },
          { label: '与老人关系', value: p.relationToElder },
        ],
      },
      {
        title: '通知偏好',
        tags: p.notificationPrefs,
      },
    ];
  }
  if (props.role === 'elder' && elderProfile.value) {
    const p = elderProfile.value;
    return [
      {
        title: '基本信息',
        rows: [
          { label: '年龄', value: `${p.age} 岁` },
          { label: '性别', value: p.gender },
          { label: '所在区域', value: p.district },
          { label: '居住地址', value: p.address },
          { label: '所属机构', value: p.orgName },
          { label: '居住情况', value: p.livingSituation },
        ],
      },
      {
        title: '健康状况',
        rows: [
          { label: '健康概况', value: p.healthStatus },
          { label: '行动能力', value: p.mobility },
        ],
      },
      {
        title: '兴趣爱好',
        tags: p.hobbies,
      },
      {
        title: '服务偏好',
        tags: p.servicePreferences,
        rows: p.preferredVisitTimes.map((t, i) => ({
          label: i === 0 ? '期望时段' : '',
          value: t,
        })),
      },
      {
        title: '紧急联系人',
        rows: [
          { label: '姓名', value: p.emergencyContact.name },
          { label: '关系', value: p.emergencyContact.relation },
          { label: '电话', value: p.emergencyContact.phone },
        ],
        note: p.notes,
      },
    ];
  }
  return [];
});

const menuItems = computed(() => {
  const switchRole =
    roleStore.activeRoles.length > 1
      ? [{ label: '切换身份', action: goRoleSelect }]
      : [];
  if (props.role === 'family') {
    return [
      ...switchRole,
      {
        label: '储值卡',
        badge: `¥${walletBalanceYuan.value}`,
        highlight: true,
        action: () => uni.navigateTo({ url: '/package-family/wallet/index' }),
      },
      { label: '待支付订单', action: goFamilyPay },
      { label: '订单列表', action: () => uni.redirectTo({ url: '/package-family/order/list' }) },
      { label: '绑定老人', action: () => uni.navigateTo({ url: '/package-family/bind' }) },
      { label: '家属首页', action: () => uni.redirectTo({ url: '/package-family/home' }) },
    ];
  }
  if (props.role === 'elder') {
    return [
      ...switchRole,
      {
        label: '储值卡',
        badge: `¥${walletBalanceYuan.value}`,
        highlight: true,
        action: () => uni.navigateTo({ url: '/package-elder/wallet/index' }),
      },
      { label: '找陪护', action: () => uni.navigateTo({ url: '/package-elder/caregivers/list' }) },
      { label: '我的服务', action: () => uni.redirectTo({ url: '/package-elder/order/list' }) },
      { label: '家属绑定码', action: () => uni.navigateTo({ url: '/package-elder/bind-code' }) },
      { label: '无障碍设置', action: () => uni.navigateTo({ url: '/package-elder/settings' }) },
      { label: '老人首页', action: () => uni.redirectTo({ url: '/package-elder/home' }) },
    ];
  }
  return [];
});

onShow(async () => {
  if (props.role === 'elder') elderFontCls.value = elderFontClass();
  try {
    if (props.role === 'family') {
      const [stats, profile, wallet] = await Promise.all([
        fetchFamilyStats(),
        fetchFamilyProfile(),
        fetchFamilyWallet().catch(() => null),
      ]);
      familyStats.value = stats;
      familyProfile.value = profile;
      if (profile.avatarUrl) roleStore.setUserAvatar(profile.avatarUrl);
      if (wallet) walletBalanceYuan.value = wallet.balanceYuan;
    }
    if (props.role === 'elder') {
      const [stats, profile, wallet] = await Promise.all([
        fetchElderStats(),
        fetchElderSelfProfile(),
        fetchElderWallet().catch(() => null),
      ]);
      elderStats.value = stats;
      elderProfile.value = profile;
      if (profile.avatarUrl) roleStore.setUserAvatar(profile.avatarUrl);
      if (wallet) walletBalanceYuan.value = wallet.balanceYuan;
    }
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
});

async function goFamilyPay() {
  if (!roleStore.user?.id) return;
  try {
    const bindings = await listBoundElders(roleStore.user.id);
    const elderIds = bindings.map((b) => b.elder).filter(Boolean);
    const orders = await listPendingPaymentOrders(elderIds);
    if (!orders.length) {
      uni.showToast({ title: '暂无待支付订单', icon: 'none' });
      return;
    }
    uni.navigateTo({ url: `/package-family/order/pay?id=${orders[0].id}` });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

function goRoleSelect() {
  uni.navigateTo({ url: '/pages/common/role-select' });
}

function goLogin() {
  uni.reLaunch({ url: '/pages/common/login' });
}

function reLogin() {
  roleStore.logout();
  uni.reLaunch({ url: '/pages/common/login' });
}

function logout() {
  roleStore.logout();
  uni.reLaunch({ url: '/pages/common/login' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--nb-page-bg, #f5f5f5);
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.hero {
  display: flex;
  align-items: center;
  background: var(--nb-hero-gradient, linear-gradient(135deg, #fff8f0, #fff));
  padding: 40rpx 32rpx;
  border-radius: var(--nb-radius-md, 16rpx);
  margin-bottom: 24rpx;
}
.hero-avatar {
  margin-right: 24rpx;
}
.hero-info {
  flex: 1;
}
.name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.tag {
  display: inline-block;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  border-radius: 8rpx;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted, #888);
}
.stats-card {
  display: flex;
  background: var(--nb-surface, #fff);
  border-radius: var(--nb-radius-sm, 12rpx);
  padding: 32rpx 0;
  margin-bottom: 24rpx;
}
.stat-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
}
.stat-num {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
.stat-num.accent {
  color: var(--nb-primary, #c45c26);
}
.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.menu-card {
  background: var(--nb-surface, #fff);
  border-radius: var(--nb-radius-sm, 12rpx);
  margin-bottom: 32rpx;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.menu-item.highlight {
  background: var(--nb-primary-soft, #fff5ef);
}
.menu-tag {
  margin-left: auto;
  margin-right: 12rpx;
  font-size: 24rpx;
  color: var(--nb-primary, #c45c26);
  font-weight: 600;
}
.arrow {
  color: #ccc;
}
.btn-outline {
  background: #fff;
  color: var(--nb-primary, #c45c26);
  border: 2rpx solid var(--nb-primary, #c45c26);
  margin-bottom: 24rpx;
}
.btn-danger {
  background: #eee;
  color: #333;
}
.action-footer {
  margin-top: 16rpx;
  margin-bottom: 32rpx;
}
.elder-relogin {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: var(--nb-radius-pill, 48rpx);
  box-shadow: var(--nb-shadow-soft, 0 4rpx 16rpx rgba(61, 42, 31, 0.06));
}
.elder-large .elder-relogin {
  height: 108rpx;
  line-height: 108rpx;
  font-size: 40rpx;
}
</style>

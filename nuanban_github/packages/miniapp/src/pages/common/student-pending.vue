<template>
  <view class="page nb-page-onboard">
    <AuthBrandHeader compact :subtitle="headerSubtitle" />
    <view class="card nb-card status-card">
      <text class="icon">{{ statusIcon }}</text>
      <text class="title">{{ statusTitle }}</text>
      <text class="desc">{{ statusDesc }}</text>
      <text class="email">{{ userLabel }}</text>
    </view>

    <view v-if="loading" class="loading">加载已提交资料…</view>
    <view v-else-if="profile" class="submitted nb-card">
      <text class="submitted-title">已提交资料（只读）</text>

      <view class="row head">
        <image :src="avatarUrl" class="avatar" mode="aspectFill" />
        <view class="head-info">
          <text class="name">{{ profile.displayName || profile.nickname || '未填' }}</text>
          <text class="meta">{{ profile.schoolName || '未填学校' }} · {{ profile.gender || '未填' }}</text>
          <text v-if="profile.major || profile.grade" class="meta">
            {{ profile.major || '未填专业' }} · {{ profile.grade || '未填年级' }}
          </text>
        </view>
      </view>

      <view class="field">
        <text class="label">联系手机号</text>
        <text class="value">{{ profile.contactPhone || '未填' }}</text>
      </view>

      <view v-if="profile.studentId" class="field">
        <text class="label">学号</text>
        <text class="value">{{ profile.studentId }}</text>
      </view>

      <view class="field">
        <text class="label">服务区域</text>
        <text class="value">{{ serviceAreaText }}</text>
      </view>

      <view class="field">
        <text class="label">可服务时间</text>
        <text class="value">{{ serviceHoursText }}</text>
      </view>

      <view class="verify-block">
        <text class="label">实名核验照</text>
        <image
          v-if="profile.verificationPhotoUrl"
          :src="profile.verificationPhotoUrl"
          class="verify-photo"
          mode="aspectFill"
          @tap="previewPhoto"
        />
        <view v-else class="verify-empty">未上传</view>
      </view>

      <text v-if="studentStatus === 'pending'" class="hint">
        资料审核中，请耐心等待。审核通过后如需修改资料，请从「编辑资料」申请重新提交审核。
      </text>
      <text v-else-if="studentStatus === 'rejected'" class="hint rejected">
        审核未通过，请修改资料后重新提交。
      </text>
    </view>

    <button v-if="studentStatus === 'rejected'" class="btn nb-btn-primary" @tap="goEdit">
      修改资料并重新提交
    </button>
    <button class="btn nb-btn-primary" :class="{ 'btn-secondary-spacing': studentStatus === 'rejected' }" @tap="logout">
      退出登录
    </button>
    <button class="btn-secondary nb-btn-soft" @tap="goLogin">切换账号</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AuthBrandHeader from '../../components/AuthBrandHeader.vue';
import { fetchStudentProfile, type StudentProfile } from '../../api/student';
import { resolveCartoonAvatarUrl } from '../../utils/cartoon-avatars';
import { serviceAreaSummary } from '../../utils/service-area-geo';
import { useRoleStore } from '../../store/role';

const roleStore = useRoleStore();
const profile = ref<StudentProfile | null>(null);
const loading = ref(true);

const studentStatus = computed(
  () => roleStore.roles.find((r) => r.role === 'student')?.status || 'pending',
);

const headerSubtitle = computed(() => {
  if (studentStatus.value === 'rejected') return '审核未通过';
  return '学生资质审核中';
});

const statusIcon = computed(() => (studentStatus.value === 'rejected' ? '❌' : '⏳'));

const statusTitle = computed(() => {
  if (studentStatus.value === 'rejected') return '审核未通过';
  return '等待审核';
});

const statusDesc = computed(() => {
  if (studentStatus.value === 'rejected') {
    return '您提交的资料未通过审核，请修改后重新提交。运营将在 1–3 个工作日内完成复审。';
  }
  return '您提交的资料已由平台受理，运营将在 1–3 个工作日内完成审核。通过后即可接单、查看收入与附近老人。';
});

const userLabel = computed(
  () => roleStore.user?.email || roleStore.user?.nickname || profile.value?.displayName || '',
);

const avatarUrl = computed(() => {
  if (!profile.value) return resolveCartoonAvatarUrl('');
  return resolveCartoonAvatarUrl(
    profile.value.cartoonAvatarId,
    profile.value.customCartoonAvatarUrl || profile.value.displayName || profile.value.nickname,
  );
});

const serviceAreaText = computed(() =>
  serviceAreaSummary({ polygons: profile.value?.serviceAreaPolygons || [] }),
);

const serviceHoursText = computed(() => {
  const hours = profile.value?.serviceHours || [];
  return hours.length ? hours.join('、') : '未选择';
});

onLoad(async () => {
  try {
    profile.value = await fetchStudentProfile();
  } catch {
    profile.value = null;
  } finally {
    loading.value = false;
  }
});

function previewPhoto() {
  const url = profile.value?.verificationPhotoUrl;
  if (!url) return;
  uni.previewImage({ urls: [url], current: url });
}

function goEdit() {
  uni.navigateTo({ url: '/package-student/profile/edit' });
}

function logout() {
  roleStore.logout();
  uni.reLaunch({ url: '/pages/common/login' });
}

function goLogin() {
  roleStore.logout();
  uni.reLaunch({ url: '/pages/common/login' });
}
</script>

<style scoped>
.status-card {
  text-align: center;
  padding: 40rpx 32rpx;
}
.icon {
  display: block;
  font-size: 72rpx;
}
.title {
  display: block;
  margin-top: 24rpx;
  font-size: 40rpx;
  font-weight: 600;
  color: var(--nb-primary);
}
.desc {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  color: var(--nb-text-secondary);
  line-height: 1.6;
  text-align: left;
}
.email {
  display: block;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.loading {
  text-align: center;
  padding: 32rpx;
  font-size: 26rpx;
  color: var(--nb-text-muted);
}
.submitted {
  margin-top: 24rpx;
  padding: 28rpx 24rpx;
}
.submitted-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  color: var(--nb-text);
}
.row.head {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.head-info {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.meta {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.field {
  margin-bottom: 16rpx;
}
.label {
  display: block;
  font-size: 22rpx;
  color: var(--nb-text-muted);
  margin-bottom: 6rpx;
}
.value {
  font-size: 28rpx;
  color: var(--nb-text);
}
.verify-block {
  margin-top: 8rpx;
}
.verify-photo {
  width: 100%;
  height: 320rpx;
  border-radius: 12rpx;
  background: #f0f0f0;
}
.verify-empty {
  height: 120rpx;
  line-height: 120rpx;
  text-align: center;
  background: #fafafa;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #bbb;
}
.hint {
  display: block;
  margin-top: 20rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
  line-height: 1.5;
}
.hint.rejected {
  color: #c45c26;
}
.btn {
  margin-top: 40rpx;
}
.btn-secondary-spacing {
  margin-top: 16rpx;
}
.btn-secondary {
  margin-top: 16rpx;
}
</style>

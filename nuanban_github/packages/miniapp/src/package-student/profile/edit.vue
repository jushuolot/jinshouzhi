<template>
  <view class="page">
    <view v-if="onboarding" class="banner">首次登录 · 请完善学生资料</view>

    <view class="identity-row">
      <CartoonAvatarPicker
        compact
        :avatar-id="cartoonAvatarId"
        :name="displayName"
        @change="onCartoonChange"
      />
      <VerificationPhotoSection
        compact
        :photo-url="verificationPhotoUrl"
        @change="onVerificationChange"
      />
    </view>

    <text class="section">显示名称</text>
    <input
      v-model="displayName"
      class="input nb-input"
      placeholder="如：林同学"
      maxlength="20"
    />

    <text class="section">学校</text>
    <SchoolSearchField v-model="schoolName" />

    <text class="section">性别</text>
    <picker :range="genders" :value="genderIdx" @change="onGenderPick">
      <view class="picker nb-input">{{ genders[genderIdx] }}</view>
    </picker>

    <text class="section">专业</text>
    <input v-model="major" class="input nb-input" placeholder="如：护理学、社会学" maxlength="32" />

    <text class="section">年级</text>
    <picker :range="grades" :value="gradeIdx" @change="onGradePick">
      <view class="picker nb-input">{{ grades[gradeIdx] }}</view>
    </picker>

    <text class="section">个人简介</text>
    <textarea v-model="bio" class="textarea nb-input" placeholder="介绍你的服务特长与公益经历" />

    <text class="section">服务区域</text>
    <input
      v-model="serviceAreasText"
      class="input nb-input"
      placeholder="多个区域用顿号分隔，如：浦东新区、黄浦区"
    />

    <text class="section">可服务时间</text>
    <textarea
      v-model="availableHoursText"
      class="textarea nb-input"
      placeholder="每行一个时段，如：周一至周五 14:00–18:00"
    />

    <button class="btn" :loading="loading" @tap="save">保存</button>
    <button v-if="!onboarding" class="btn-outline" @tap="goBack">取消</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import CartoonAvatarPicker from '../../components/CartoonAvatarPicker.vue';
import VerificationPhotoSection from '../../components/VerificationPhotoSection.vue';
import SchoolSearchField from '../../components/SchoolSearchField.vue';
import { fetchStudentProfile, updateStudentProfile } from '../../api/student';
import { useRoleStore } from '../../store/role';
import { resolveCartoonAvatarUrl, defaultCartoonAvatarId } from '../../utils/cartoon-avatars';
import { finishProfileOnboarding } from '../../utils/profile-onboarding';
import { isKnownSchool } from '../../utils/known-schools';
import { pbErrorMessage } from '../../utils/request';

const grades = ['大一', '大二', '大三', '大四', '研一', '研二'];
const genders = ['女', '男'];
const displayName = ref('');
const major = ref('');
const genderIdx = ref(0);
const cartoonAvatarId = ref('');
const verificationPhotoUrl = ref('');
const schoolName = ref('');
const gradeIdx = ref(2);
const bio = ref('');
const serviceAreasText = ref('');
const availableHoursText = ref('');
const loading = ref(false);
const onboarding = ref(false);
const roleStore = useRoleStore();

onLoad((query) => {
  onboarding.value = query?.onboarding === '1';
});

function goBack() {
  uni.navigateBack();
}

onShow(async () => {
  try {
    const p = await fetchStudentProfile();
    displayName.value = p.displayName || p.nickname || roleStore.user?.nickname || '';
    major.value = p.major || '';
    cartoonAvatarId.value = p.cartoonAvatarId || defaultCartoonAvatarId(displayName.value);
    verificationPhotoUrl.value = p.verificationPhotoUrl || '';
    schoolName.value = isKnownSchool(p.schoolName || '') ? p.schoolName : '';
    const gIdx = grades.indexOf(p.grade || '');
    gradeIdx.value = gIdx >= 0 ? gIdx : 2;
    const genderVal = p.gender === '男' ? '男' : '女';
    genderIdx.value = genders.indexOf(genderVal);
    bio.value = p.bio || '';
    serviceAreasText.value = (p.serviceAreas || []).join('、');
    availableHoursText.value = (p.availableHours || []).join('\n');
  } catch {
    displayName.value = roleStore.user?.nickname || '';
  }
});

function onCartoonChange(id: string) {
  cartoonAvatarId.value = id;
}

function onVerificationChange(url: string) {
  verificationPhotoUrl.value = url;
}

function onGradePick(e: { detail: { value: string } }) {
  gradeIdx.value = Number(e.detail.value);
}

function onGenderPick(e: { detail: { value: string } }) {
  genderIdx.value = Number(e.detail.value);
}

function splitAreas(text: string) {
  return text
    .split(/[、,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitHours(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function save() {
  const name = displayName.value.trim();
  if (!name) {
    uni.showToast({ title: '请填写显示名称', icon: 'none' });
    return;
  }
  if (!isKnownSchool(schoolName.value)) {
    uni.showToast({ title: '请从列表中选择有效学校', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await updateStudentProfile({
      displayName: name,
      schoolName: schoolName.value,
      gender: genders[genderIdx.value],
      major: major.value.trim(),
      grade: grades[gradeIdx.value],
      bio: bio.value,
      serviceAreas: splitAreas(serviceAreasText.value),
      availableHours: splitHours(availableHoursText.value),
      cartoonAvatarId: cartoonAvatarId.value,
    });
    roleStore.setUserAvatar(resolveCartoonAvatarUrl(cartoonAvatarId.value));
    uni.showToast({ title: '已保存', icon: 'success' });
    if (onboarding.value) {
      setTimeout(() => finishProfileOnboarding('student'), 500);
    } else {
      setTimeout(() => uni.navigateBack(), 500);
    }
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--nb-page-bg, #f5f5f5);
  padding: 24rpx;
  padding-bottom: 48rpx;
}
.banner {
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  font-size: 26rpx;
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  border-radius: var(--nb-radius-sm, 12rpx);
}
.identity-row {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 16rpx 0 24rpx;
}
.section {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin: 24rpx 0 12rpx;
  color: var(--nb-text, #333);
}
.input,
.picker,
.textarea {
  background: var(--nb-surface, #fff);
  padding: 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
}
.textarea {
  min-height: 160rpx;
}
.btn {
  margin-top: 40rpx;
  background: var(--nb-primary, #c45c26);
  color: #fff;
  border-radius: var(--nb-radius-sm, 12rpx);
}
.btn-outline {
  margin-top: 24rpx;
  background: #fff;
  color: var(--nb-primary, #c45c26);
  border: 2rpx solid var(--nb-primary, #c45c26);
  border-radius: var(--nb-radius-sm, 12rpx);
}
</style>

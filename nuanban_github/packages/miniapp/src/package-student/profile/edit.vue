<template>
  <view class="page">
    <text class="section">头像</text>
    <view class="avatar-row">
      <ProfileAvatar :avatar-url="avatarUrl" :name="displayName" @change="onAvatarChange" />
      <text class="avatar-hint">点击更换头像</text>
    </view>

    <text class="section">显示名称</text>
    <input v-model="displayName" class="input nb-input" placeholder="如：林同学" />

    <text class="section">学校</text>
    <picker :range="schools" :value="schoolIdx" @change="onSchoolPick">
      <view class="picker nb-input">{{ schools[schoolIdx] }}</view>
    </picker>

    <text class="section">专业</text>
    <input v-model="major" class="input nb-input" placeholder="如：护理学" />

    <text class="section">年级</text>
    <picker :range="grades" :value="gradeIdx" @change="onGradePick">
      <view class="picker nb-input">{{ grades[gradeIdx] }}</view>
    </picker>

    <text class="section">个人简介</text>
    <textarea v-model="bio" class="textarea nb-input" placeholder="介绍你的服务特长与公益经历" />

    <text class="section">服务区域</text>
    <input v-model="serviceAreasText" class="input nb-input" placeholder="多个区域用顿号分隔，如：浦东新区、黄浦区" />

    <text class="section">可服务时间</text>
    <textarea
      v-model="availableHoursText"
      class="textarea nb-input"
      placeholder="每行一个时段，如：周一至周五 14:00–18:00"
    />

    <text class="hint">切换学校后，「发现」页学校合作筛选结果会变化</text>
    <button class="btn" :loading="loading" @tap="save">保存</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ProfileAvatar from '../../components/ProfileAvatar.vue';
import { fetchStudentProfile, updateStudentProfile } from '../../api/student';
import { DEMO_SCHOOLS } from '../../utils/demo-rich-data';
import { pbErrorMessage } from '../../utils/request';

const schools = [...DEMO_SCHOOLS];
const grades = ['大一', '大二', '大三', '大四', '研一', '研二'];
const displayName = ref('');
const avatarUrl = ref('');
const schoolIdx = ref(0);
const gradeIdx = ref(2);
const major = ref('');
const bio = ref('');
const serviceAreasText = ref('');
const availableHoursText = ref('');
const loading = ref(false);

onShow(async () => {
  try {
    const p = await fetchStudentProfile();
    displayName.value = p.displayName || p.nickname;
    avatarUrl.value = p.avatarUrl || '';
    const idx = schools.indexOf(p.schoolName as (typeof schools)[number]);
    schoolIdx.value = idx >= 0 ? idx : 0;
    major.value = p.major || '';
    const gIdx = grades.indexOf(p.grade || '');
    gradeIdx.value = gIdx >= 0 ? gIdx : 2;
    bio.value = p.bio || '';
    serviceAreasText.value = (p.serviceAreas || []).join('、');
    availableHoursText.value = (p.availableHours || []).join('\n');
  } catch {
    /* ignore */
  }
});

function onAvatarChange(url: string) {
  avatarUrl.value = url;
}

function onSchoolPick(e: { detail: { value: string } }) {
  schoolIdx.value = Number(e.detail.value);
}

function onGradePick(e: { detail: { value: string } }) {
  gradeIdx.value = Number(e.detail.value);
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
  loading.value = true;
  try {
    await updateStudentProfile({
      displayName: displayName.value,
      schoolName: schools[schoolIdx.value],
      major: major.value,
      grade: grades[gradeIdx.value],
      bio: bio.value,
      serviceAreas: splitAreas(serviceAreasText.value),
      availableHours: splitHours(availableHoursText.value),
    });
    uni.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
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
.section {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin: 24rpx 0 12rpx;
  color: var(--nb-text, #333);
}
.avatar-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 0;
}
.avatar-hint {
  font-size: 24rpx;
  color: var(--nb-text-muted, #999);
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
.hint {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #bbb);
}
.btn {
  margin-top: 40rpx;
  background: var(--nb-primary, #c45c26);
  color: #fff;
  border-radius: var(--nb-radius-sm, 12rpx);
}
</style>

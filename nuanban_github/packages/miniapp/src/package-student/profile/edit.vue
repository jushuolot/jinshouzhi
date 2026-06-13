<template>
  <view class="page">
    <view v-if="showLockedBanner" class="audit-banner active-pass">
      <text>审核已通过 · 资料已锁定，修改需重新提交审核</text>
    </view>
    <view v-else-if="showResubmitBanner" class="audit-banner">
      <text>修改资料后将重新进入审核，通过前无法接单</text>
    </view>
    <view v-else-if="studentStatus === 'rejected'" class="audit-banner rejected">
      <text>审核未通过 · 请修改资料后重新提交</text>
    </view>

    <text class="section">形象资料</text>
    <text class="field-hint">卡通头像与核验照用于接单展示与运营审核</text>

    <text class="field-label">卡通头像</text>
    <view class="identity-block">
      <CartoonAvatarPicker
        :avatar-id="cartoonAvatarId"
        :custom-url="customCartoonUrl"
        :name="displayName"
        :editable="editable"
        @change="onCartoonChange"
        @custom-change="onCustomCartoonPreview"
      />
    </view>

    <text class="field-label">实名核验照</text>
    <view class="identity-block">
      <VerificationPhotoSection
        :photo-url="verificationPhotoUrl"
        :editable="editable"
        @change="onVerificationChange"
      />
    </view>

    <text class="section">基本信息</text>

    <text class="field-label">显示名称</text>
    <input
      v-if="editable"
      v-model="displayName"
      class="input nb-input"
      type="text"
      placeholder="如：林同学"
      maxlength="20"
    />
    <text v-else class="readonly">{{ displayName || '未填' }}</text>

    <text class="field-label">学校</text>
    <SchoolSearchField v-model="schoolName" :disabled="!editable" />

    <text class="field-label">性别</text>
    <picker v-if="editable" :range="genders" :value="genderIdx" @change="onGenderPick">
      <view class="picker nb-input">{{ genders[genderIdx] }}</view>
    </picker>
    <text v-else class="readonly">{{ genders[genderIdx] }}</text>

    <text class="field-label">专业</text>
    <input
      v-if="editable"
      v-model="major"
      class="input nb-input"
      type="text"
      placeholder="如：护理学、社会学"
      maxlength="32"
    />
    <text v-else class="readonly">{{ major || '未填' }}</text>

    <text class="field-label">年级</text>
    <picker v-if="editable" :range="grades" :value="gradeIdx" @change="onGradePick">
      <view class="picker nb-input">{{ grades[gradeIdx] }}</view>
    </picker>
    <text v-else class="readonly">{{ grades[gradeIdx] }}</text>

    <text class="field-label">联系手机号</text>
    <input
      v-if="editable"
      v-model="contactPhone"
      class="input nb-input"
      type="number"
      maxlength="11"
      placeholder="11 位手机号"
    />
    <text v-else class="readonly">{{ contactPhone || '未填' }}</text>

    <text class="field-label">学号（选填）</text>
    <input
      v-if="editable"
      v-model="studentId"
      class="input nb-input"
      type="text"
      placeholder="校内学号"
      maxlength="32"
    />
    <text v-else class="readonly">{{ studentId || '未填' }}</text>

    <text class="section">服务安排</text>
    <text class="field-label">服务区域</text>
    <ServiceAreaMapPicker v-model="serviceAreaGeo" :disabled="!editable" />
    <text class="field-label">可服务时间</text>
    <ServiceTimePicker v-model="serviceHours" :disabled="!editable" />

    <button v-if="showApplyEditBtn" class="btn-outline" @tap="startResubmit">申请修改资料</button>
    <button v-if="editable" class="btn" :loading="loading" @tap="save">保存并提交审核</button>
    <button v-if="showCancelBtn" class="btn-outline" @tap="cancelEdit">取消</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import CartoonAvatarPicker from '../../components/CartoonAvatarPicker.vue';
import VerificationPhotoSection from '../../components/VerificationPhotoSection.vue';
import SchoolSearchField from '../../components/SchoolSearchField.vue';
import ServiceAreaMapPicker from '../../components/ServiceAreaMapPicker.vue';
import ServiceTimePicker from '../../components/ServiceTimePicker.vue';
import { fetchStudentProfile, updateStudentProfile } from '../../api/student';
import { useRoleStore } from '../../store/role';
import { resolveCartoonAvatarUrl, defaultCartoonAvatarId } from '../../utils/cartoon-avatars';
import { isKnownSchool } from '../../utils/known-schools';
import { pbErrorMessage } from '../../utils/request';
import { isValidCnMobile } from '../../utils/login-phone';
import { emptyServiceAreaGeo, type ServiceAreaGeo } from '../../utils/service-area-geo';
import type { CameraPickResult } from '../../utils/camera-picker';
import { uploadCustomCartoonPick } from '../../utils/cartoon-avatar-upload';

const grades = ['大一', '大二', '大三', '大四', '研一', '研二'];
const genders = ['女', '男'];
const displayName = ref('');
const major = ref('');
const contactPhone = ref('');
const studentId = ref('');
const serviceAreaGeo = ref<ServiceAreaGeo>(emptyServiceAreaGeo());
const serviceHours = ref<string[]>([]);
const customCartoonUrl = ref('');
const customCartoonPick = ref<CameraPickResult | null>(null);
const genderIdx = ref(0);
const cartoonAvatarId = ref('');
const verificationPhotoUrl = ref('');
const schoolName = ref('');
const gradeIdx = ref(2);
const loading = ref(false);
const resubmitMode = ref(false);
const profileLoaded = ref(false);
const roleStore = useRoleStore();

const studentStatus = computed(() => {
  return roleStore.roles.find((r) => r.role === 'student')?.status || '';
});

/** 仅审核未通过，或已通过且主动申请修改时可编辑 */
const editable = computed(() => {
  const st = studentStatus.value;
  if (st === 'rejected') return true;
  if (st === 'active') return resubmitMode.value;
  return false;
});

const showLockedBanner = computed(
  () => studentStatus.value === 'active' && !resubmitMode.value,
);

const showResubmitBanner = computed(
  () => studentStatus.value === 'active' && resubmitMode.value,
);

const showApplyEditBtn = computed(
  () => studentStatus.value === 'active' && !resubmitMode.value,
);

const showCancelBtn = computed(() => editable.value);

onLoad(async (query) => {
  const st = studentStatus.value;
  if (st === 'pending' || query?.onboarding === '1') {
    uni.reLaunch({ url: '/pages/common/student-pending' });
    return;
  }
  if (st !== 'active' && st !== 'rejected') {
    uni.reLaunch({ url: '/pages/common/student-pending' });
    return;
  }
  await loadProfile();
});

function startResubmit() {
  resubmitMode.value = true;
}

function cancelEdit() {
  if (resubmitMode.value) {
    resubmitMode.value = false;
    void loadProfile(true);
    return;
  }
  uni.navigateBack();
}

async function loadProfile(force = false) {
  if (profileLoaded.value && !force) return;
  try {
    const p = await fetchStudentProfile();
    displayName.value = p.displayName || p.nickname || roleStore.user?.nickname || '';
    major.value = p.major || '';
    contactPhone.value = p.contactPhone || '';
    studentId.value = p.studentId || '';
    serviceAreaGeo.value = { polygons: p.serviceAreaPolygons || [] };
    serviceHours.value = p.serviceHours || [];
    customCartoonUrl.value = p.customCartoonAvatarUrl || '';
    cartoonAvatarId.value = p.cartoonAvatarId || defaultCartoonAvatarId(displayName.value);
    verificationPhotoUrl.value = p.verificationPhotoUrl || '';
    schoolName.value = p.schoolName && isKnownSchool(p.schoolName) ? p.schoolName : '';
    const gIdx = grades.indexOf(p.grade || '');
    gradeIdx.value = gIdx >= 0 ? gIdx : 2;
    const genderVal = p.gender === '男' ? '男' : '女';
    genderIdx.value = genders.indexOf(genderVal);
  } catch {
    displayName.value = roleStore.user?.nickname || '';
    cartoonAvatarId.value = defaultCartoonAvatarId(displayName.value);
  } finally {
    profileLoaded.value = true;
  }
}

function onCartoonChange(id: string) {
  cartoonAvatarId.value = id;
  if (id) {
    customCartoonUrl.value = '';
    customCartoonPick.value = null;
  }
}

async function onCustomCartoonPreview(url: string) {
  customCartoonUrl.value = url;
  if (!url) {
    customCartoonPick.value = null;
    return;
  }
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], 'cartoon.jpg', { type: blob.type || 'image/jpeg' });
      customCartoonPick.value = { filePath: url, previewUrl: url, file };
    } catch {
      customCartoonPick.value = { filePath: url, previewUrl: url };
    }
  } else {
    customCartoonPick.value = { filePath: url, previewUrl: url };
  }
  cartoonAvatarId.value = '';
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

async function save() {
  const name = displayName.value.trim();
  if (!name) {
    uni.showToast({ title: '请填写显示名称', icon: 'none' });
    return;
  }
  if (!isKnownSchool(schoolName.value)) {
    uni.showToast({ title: '请从学校列表中点选', icon: 'none' });
    return;
  }
  if (!verificationPhotoUrl.value) {
    uni.showToast({ title: '请先拍摄实名核验照', icon: 'none' });
    return;
  }
  if (!isValidCnMobile(contactPhone.value)) {
    uni.showToast({ title: '请填写 11 位联系手机号', icon: 'none' });
    return;
  }
  if (!serviceAreaGeo.value.polygons.length) {
    uni.showToast({ title: '请在地图上选择服务区域', icon: 'none' });
    return;
  }
  if (!serviceHours.value.length) {
    uni.showToast({ title: '请选择可服务时间', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    if (customCartoonPick.value) {
      const url = await uploadCustomCartoonPick(customCartoonPick.value);
      customCartoonUrl.value = url;
    }
    await updateStudentProfile({
      displayName: name,
      schoolName: schoolName.value,
      gender: genders[genderIdx.value],
      major: major.value.trim(),
      grade: grades[gradeIdx.value],
      contactPhone: contactPhone.value.trim(),
      studentId: studentId.value.trim() || undefined,
      cartoonAvatarId: cartoonAvatarId.value || undefined,
      serviceAreaPolygons: serviceAreaGeo.value.polygons,
      serviceHours: serviceHours.value,
      resubmitAudit: true,
    });
    roleStore.setUserAvatar(resolveCartoonAvatarUrl(cartoonAvatarId.value, customCartoonUrl.value));
    roleStore.setUserNickname(name);
    roleStore.setStudentRoleStatus('pending');
    uni.showToast({ title: '已提交审核', icon: 'success' });
    setTimeout(() => uni.reLaunch({ url: '/pages/common/student-pending' }), 500);
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
.audit-banner {
  padding: 16rpx 20rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #666;
  background: #f3f3f3;
  border-radius: 12rpx;
}
.audit-banner.active-pass {
  color: #2a7d4f;
  background: #eef8f2;
}
.audit-banner.rejected {
  color: #c45c26;
  background: #fff5ef;
}
.identity-block {
  margin-bottom: 8rpx;
}
.section {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin: 28rpx 0 8rpx;
  color: var(--nb-text, #333);
}
.section:first-of-type {
  margin-top: 8rpx;
}
.field-hint {
  display: block;
  margin-bottom: 12rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #999);
  line-height: 1.45;
}
.field-label {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-secondary, #666);
  margin: 16rpx 0 8rpx;
}
.input,
.picker,
.readonly {
  background: var(--nb-surface, #fff);
  padding: 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
  pointer-events: auto;
}
.readonly {
  display: block;
  color: var(--nb-text, #333);
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

<template>
  <view class="page nb-page-onboard">
    <AuthBrandHeader compact :subtitle="guestEntry ? '注册后才能下单、接单' : '选择身份 · 系统分配功能与权限'" />
    <template v-if="guestEntry && !roleStore.isLoggedIn">
      <view class="guest-banner">
        <text class="guest-title">注册后才能下单</text>
        <text class="guest-desc">请先使用手机或微信完成注册登录，再选择身份并完善资料与收款方式。</text>
      </view>
      <view class="btn-primary nb-btn-primary" @tap="goAuth">手机号注册 / 登录</view>
      <text class="back" @tap="goBackBrowse">返回继续浏览</text>
    </template>
    <template v-else-if="step === 'pick'">
      <view
        v-for="opt in roleOptions"
        :key="opt.key"
        class="card nb-card nb-card-interactive"
        @tap="pickRole(opt.key)"
      >
        <text class="role-icon">{{ opt.icon }}</text>
        <text class="card-title">{{ opt.label }}</text>
        <text class="card-desc">{{ opt.desc }}</text>
      </view>
      <text class="back" @tap="goLogin">返回登录</text>
    </template>
    <template v-else>
      <text class="step-title">完善资料 · {{ roleLabel[role] }}</text>
      <view v-if="referralCode && role === 'student'" class="ref-tip">
        已绑定推荐码 {{ referralCode }} · 注册成功推荐人得奖励
      </view>

      <template v-if="role === 'student'">
        <text class="section-label">基本信息</text>
        <text class="field-label">显示名称</text>
        <input v-model="displayName" class="input nb-input" placeholder="如：林同学" maxlength="20" />

        <text class="field-label">联系手机号</text>
        <input
          v-model="contactPhone"
          class="input nb-input"
          type="number"
          maxlength="11"
          placeholder="11 位手机号"
        />
        <text class="field-hint">默认使用登录手机号，可修改为其他联系号码</text>

        <text class="field-label">学号（选填）</text>
        <input v-model="studentId" class="input nb-input" placeholder="校内学号" maxlength="32" />

        <text class="field-label">学校</text>
        <SchoolSearchField v-model="schoolName" />

        <text class="field-label">性别</text>
        <picker :range="genders" :value="genderIdx" @change="onGenderPick">
          <view class="picker nb-input">{{ genders[genderIdx] }}</view>
        </picker>

        <text class="field-label">专业</text>
        <input v-model="major" class="input nb-input" placeholder="如：护理学、社会学" maxlength="32" />

        <text class="field-label">年级</text>
        <picker :range="grades" :value="gradeIdx" @change="onGradePick">
          <view class="picker nb-input">{{ grades[gradeIdx] }}</view>
        </picker>

        <text class="section-label">形象资料（审核用）</text>
        <text class="field-label">卡通头像</text>
        <CartoonAvatarPicker
          :avatar-id="cartoonAvatarId"
          :custom-url="customCartoonPreview"
          :name="displayName"
          @change="onCartoonChange"
          @custom-change="onCustomCartoonChange"
        />

        <text class="field-label">实名核验照</text>
        <VerificationPhotoSection
          :photo-url="verificationPreviewUrl"
          :upload-on-capture="false"
          compact
          @change="onVerificationPreview"
          @pick="onVerificationPick"
        />

        <text class="section-label">服务安排</text>
        <text class="field-label">服务区域</text>
        <ServiceAreaMapPicker v-model="serviceAreaGeo" />

        <text class="field-label">可服务时间</text>
        <ServiceTimePicker v-model="serviceHours" />
      </template>

      <template v-else>
        <input v-model="wechatId" class="input nb-input" placeholder="微信号（平台联系用，不对外展示）" />
        <text class="field-hint">手机号已在登录时绑定；微信号仅运营审核与异常联系，不会给对方学生/家属</text>
        <template v-if="role === 'elder'">
          <text class="section-label">性别</text>
          <picker :range="genders" :value="genderIdx" @change="onGenderPick">
            <view class="picker nb-input">{{ genders[genderIdx] }}</view>
          </picker>
        </template>
      </template>

      <button class="btn-primary nb-btn-primary" :loading="loading" @tap="submit">
        {{ role === 'student' ? '提交并等待审核' : '确认身份' }}
      </button>
      <text class="back" @tap="step = 'pick'">重新选择身份</text>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { registerRole } from '../../api/auth';
import AuthBrandHeader from '../../components/AuthBrandHeader.vue';
import CartoonAvatarPicker from '../../components/CartoonAvatarPicker.vue';
import SchoolSearchField from '../../components/SchoolSearchField.vue';
import VerificationPhotoSection from '../../components/VerificationPhotoSection.vue';
import ServiceAreaMapPicker from '../../components/ServiceAreaMapPicker.vue';
import ServiceTimePicker from '../../components/ServiceTimePicker.vue';
import { takePendingReferralCode } from '../../utils/demo-referral';
import type { RoleKey } from '../../config/tabs';
import { ROLE_HOME } from '../../config/tabs';
import { fetchStudentProfile } from '../../api/student';
import { isStudentAuditProfileComplete } from '../../utils/student-audit-profile';
import { navigateAfterAuth } from '../../utils/profile-onboarding';
import { useRoleStore } from '../../store/role';
import { isKnownSchool } from '../../utils/known-schools';
import { defaultCartoonAvatarId, resolveCartoonAvatarUrl } from '../../utils/cartoon-avatars';
import type { CameraPickResult } from '../../utils/camera-picker';
import { uploadVerificationPick } from '../../utils/verification-photo';
import { uploadCustomCartoonPick } from '../../utils/cartoon-avatar-upload';
import { pbErrorMessage } from '../../utils/request';
import { isValidCnMobile, phoneFromLoginEmail } from '../../utils/login-phone';
import { emptyServiceAreaGeo, type ServiceAreaGeo } from '../../utils/service-area-geo';

const grades = ['大一', '大二', '大三', '大四', '研一', '研二'];
const genders = ['女', '男'];
const role = ref<RoleKey>('student');
const displayName = ref('');
const contactPhone = ref('');
const wechatId = ref('');
const studentId = ref('');
const schoolName = ref('');
const major = ref('');
const cartoonAvatarId = ref('');
const customCartoonPreview = ref('');
const customCartoonPick = ref<CameraPickResult | null>(null);
const serviceAreaGeo = ref<ServiceAreaGeo>(emptyServiceAreaGeo());
const serviceHours = ref<string[]>([]);
const verificationPreviewUrl = ref('');
const verificationPick = ref<CameraPickResult | null>(null);
const genderIdx = ref(0);
const gradeIdx = ref(2);
const loading = ref(false);
const step = ref<'pick' | 'form'>('pick');
const referralCode = ref('');
const roleStore = useRoleStore();
const guestEntry = ref(false);

const roleLabel: Record<RoleKey, string> = {
  elder: '老人',
  family: '家属',
  student: '学生',
};

const roleOptions = [
  { key: 'student' as RoleKey, icon: '🎓', label: '我是学生', desc: '接单陪护 · 收入结算' },
  { key: 'family' as RoleKey, icon: '👨‍👩‍👧', label: '我是家属', desc: '绑定老人 · 代付订单 · 外出审批' },
  { key: 'elder' as RoleKey, icon: '🌸', label: '我是老人', desc: '找附近同学 · 预约陪护 · 一键求助' },
];

onLoad(async (q) => {
  guestEntry.value = q?.from === 'guest';
  if (!roleStore.isLoggedIn) {
    if (guestEntry.value) return;
    uni.reLaunch({ url: '/pages/common/login' });
    return;
  }

  const studentRole = roleStore.roles.find((r) => r.role === 'student');
  if (studentRole?.status === 'pending' || studentRole?.status === 'rejected') {
    uni.reLaunch({ url: '/pages/common/student-pending' });
    return;
  }

  if (studentRole?.status === 'active') {
    try {
      const profile = await fetchStudentProfile();
      if (isStudentAuditProfileComplete(profile)) {
        roleStore.setActiveRole('student');
        uni.reLaunch({ url: ROLE_HOME.student });
        return;
      }
      await prefillFromProfile(profile);
      role.value = 'student';
      step.value = 'form';
      return;
    } catch {
      role.value = 'student';
      step.value = 'form';
      contactPhone.value = phoneFromLoginEmail(roleStore.user?.email);
      return;
    }
  }

  if (roleStore.roles.length > 0 && !studentRole) {
    if (roleStore.hasMultipleRoles) {
      uni.reLaunch({ url: '/pages/common/role-select' });
      return;
    }
    const only = roleStore.roles[0]?.role;
    if (only && only !== 'student') {
      uni.reLaunch({ url: ROLE_HOME[only] });
      return;
    }
  }

  referralCode.value = takePendingReferralCode();
  contactPhone.value = phoneFromLoginEmail(roleStore.user?.email);
  if (q?.role) {
    role.value = q.role as RoleKey;
    step.value = 'form';
  } else if (q?.step === 'form') {
    role.value = 'student';
    step.value = 'form';
  }
});

async function prefillFromProfile(p: Awaited<ReturnType<typeof fetchStudentProfile>>) {
  displayName.value = p.displayName || '';
  contactPhone.value = p.contactPhone || phoneFromLoginEmail(roleStore.user?.email);
  studentId.value = p.studentId || '';
  schoolName.value = p.schoolName && isKnownSchool(p.schoolName) ? p.schoolName : '';
  major.value = p.major || '';
  cartoonAvatarId.value = p.cartoonAvatarId || '';
  customCartoonPreview.value = p.customCartoonAvatarUrl || '';
  verificationPreviewUrl.value = p.verificationPhotoUrl || '';
  serviceAreaGeo.value = { polygons: p.serviceAreaPolygons || [] };
  serviceHours.value = p.serviceHours || [];
  const gIdx = grades.indexOf(p.grade || '');
  gradeIdx.value = gIdx >= 0 ? gIdx : 2;
  const genderVal = p.gender === '男' ? '男' : '女';
  genderIdx.value = genders.indexOf(genderVal);
}

function pickRole(r: RoleKey) {
  role.value = r;
  step.value = 'form';
  if (r === 'student' && !cartoonAvatarId.value) {
    cartoonAvatarId.value = defaultCartoonAvatarId('');
  }
}

function onGenderPick(e: { detail: { value: string } }) {
  genderIdx.value = Number(e.detail.value);
}

function onGradePick(e: { detail: { value: string } }) {
  gradeIdx.value = Number(e.detail.value);
}

function onCartoonChange(id: string) {
  cartoonAvatarId.value = id;
  if (id) {
    customCartoonPreview.value = '';
    customCartoonPick.value = null;
  }
}

async function onCustomCartoonChange(url: string) {
  customCartoonPreview.value = url;
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

function onVerificationPreview(url: string) {
  verificationPreviewUrl.value = url;
}

function onVerificationPick(pick: CameraPickResult) {
  verificationPick.value = pick;
}

async function dataUrlToPick(dataUrl: string): Promise<CameraPickResult> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], 'verification.jpg', { type: blob.type || 'image/jpeg' });
  return { filePath: dataUrl, previewUrl: dataUrl, file };
}

function resolveVerificationPick(): CameraPickResult | null {
  if (verificationPick.value) return verificationPick.value;
  const url = verificationPreviewUrl.value;
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return { filePath: url, previewUrl: url };
  }
  return null;
}

function goAuth() {
  uni.navigateTo({ url: '/pages/common/login?from=guest' });
}

function goBackBrowse() {
  uni.navigateBack();
}

function goLogin() {
  uni.reLaunch({ url: '/pages/common/login' });
}

async function submit() {
  if (role.value === 'student') {
    if (!isValidCnMobile(contactPhone.value)) {
      uni.showToast({ title: '请填写 11 位联系手机号', icon: 'none' });
      return;
    }
  } else if (!wechatId.value.trim()) {
    uni.showToast({ title: '请填写微信号', icon: 'none' });
    return;
  }

  if (role.value === 'student') {
    const name = displayName.value.trim();
    if (!name) {
      uni.showToast({ title: '请填写显示名称', icon: 'none' });
      return;
    }
    if (!isKnownSchool(schoolName.value)) {
      uni.showToast({ title: '请从学校列表中点选', icon: 'none' });
      return;
    }
    if (!resolveVerificationPick()) {
      uni.showToast({ title: '请先拍摄或选择实名核验照', icon: 'none' });
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
    if (!cartoonAvatarId.value && !customCartoonPreview.value) {
      uni.showToast({ title: '请选择或上传卡通头像', icon: 'none' });
      return;
    }
  }

  loading.value = true;
  try {
    const roles = await registerRole({
      role: role.value,
      ...(role.value === 'student'
        ? {
            contactPhone: contactPhone.value.trim(),
            displayName: displayName.value.trim(),
            schoolName: schoolName.value,
            gender: genders[genderIdx.value],
            major: major.value.trim(),
            grade: grades[gradeIdx.value],
            studentId: studentId.value.trim() || undefined,
            cartoonAvatarId: cartoonAvatarId.value || undefined,
            serviceAreaPolygons: serviceAreaGeo.value.polygons,
            serviceHours: serviceHours.value,
            referralCode: referralCode.value || undefined,
          }
        : {
            wechatId: wechatId.value.trim(),
            gender: role.value === 'elder' ? genders[genderIdx.value] : undefined,
          }),
    });

    roleStore.setAuth({
      token: roleStore.token,
      roles,
      user: roleStore.user
        ? { ...roleStore.user, nickname: displayName.value.trim() || roleStore.user.nickname }
        : undefined,
      activeRole: role.value,
    });

    if (role.value === 'student') {
      if (customCartoonPick.value) {
        try {
          const url = await uploadCustomCartoonPick(customCartoonPick.value);
          customCartoonPreview.value = url;
          roleStore.setUserAvatar(url);
        } catch (e) {
          uni.showToast({
            title: `资料已提交，自定义头像上传失败：${pbErrorMessage(e)}`,
            icon: 'none',
            duration: 3000,
          });
        }
      } else if (cartoonAvatarId.value) {
        roleStore.setUserAvatar(resolveCartoonAvatarUrl(cartoonAvatarId.value));
      }

      let pick = verificationPick.value || (await (async () => {
        const r = resolveVerificationPick();
        if (!r?.previewUrl?.startsWith('data:')) return r;
        if (r.file) return r;
        return dataUrlToPick(r.previewUrl);
      })());
      if (pick) {
        try {
          await uploadVerificationPick(pick);
        } catch (e) {
          uni.showToast({
            title: `资料已提交，核验照上传失败：${pbErrorMessage(e)}`,
            icon: 'none',
            duration: 3000,
          });
        }
      }
    }

    const studentRole = roles.find((r) => r.role === 'student');
    if (role.value === 'student' && studentRole?.status === 'pending') {
      uni.showToast({ title: '已提交，等待运营审核', icon: 'success' });
      uni.reLaunch({ url: '/pages/common/student-pending' });
      return;
    }
    uni.showToast({ title: '身份已设定', icon: 'success' });
    void navigateAfterAuth(role.value);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.section-label {
  display: block;
  margin: 28rpx 0 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--nb-text, #333);
}
.field-label {
  display: block;
  margin: 16rpx 0 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-secondary, #666);
}
.picker {
  padding: 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
}
.field-hint {
  display: block;
  margin: 8rpx 0 20rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
  line-height: 1.45;
}
.step-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--nb-text);
  margin-bottom: 8rpx;
}
.role-icon {
  display: block;
  font-size: 44rpx;
  margin-bottom: 12rpx;
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
.ref-tip {
  display: block;
  margin: 16rpx 0 8rpx;
  padding: 16rpx 20rpx;
  font-size: 24rpx;
  color: var(--nb-primary);
  background: var(--nb-primary-soft);
  border-radius: var(--nb-radius-sm);
  border: 2rpx dashed var(--nb-border-dashed);
}
.input {
  margin: 8rpx 0 16rpx;
}
.btn-primary {
  margin-top: 32rpx;
  text-align: center;
  line-height: 96rpx;
}
.back {
  display: block;
  margin-top: 40rpx;
  text-align: center;
  color: var(--nb-primary);
  font-size: 28rpx;
}
.guest-banner {
  margin-bottom: 32rpx;
  padding: 28rpx 24rpx;
  background: var(--nb-primary-soft);
  border: 2rpx dashed var(--nb-border-dashed);
  border-radius: var(--nb-radius-md);
}
.guest-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-primary);
}
.guest-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
  line-height: 1.55;
}
</style>

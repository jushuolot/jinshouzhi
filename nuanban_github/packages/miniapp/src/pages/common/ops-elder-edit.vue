<template>
  <view class="page nb-page">
    <text class="title">编辑老人档案</text>
    <text class="sub">运营维护全部资料 · 保存后老人端即时可见</text>

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="profile" class="form-body">
      <view class="avatar-row">
        <view class="avatar-tap" @tap="pickAvatar">
          <ProfileAvatar
            :avatar-url="avatarUrl"
            :name="elderName"
            :editable="false"
          />
        </view>
        <view class="avatar-meta" @tap="pickAvatar">
          <text class="avatar-hint">{{ profile.userId ? '点击上传/更换头像' : '未绑定登录账号，无法上传头像' }}</text>
          <text v-if="loginPhone" class="login-phone">登录手机 {{ loginPhone }}</text>
        </view>
      </view>

      <view class="basic-fields">
        <text class="section">基本信息</text>

        <text class="label">姓名</text>
        <FieldInput v-model="elderName" placeholder="如：张奶奶" />

        <text class="label">联系手机</text>
        <FieldInput
          v-model="contactPhone"
          type="tel"
          :maxlength="11"
          placeholder="可与登录手机相同"
        />

        <text class="label">年龄</text>
        <FieldInput v-model="ageText" type="number" placeholder="如：78" />
      </view>

      <text class="label">性别</text>
      <picker :range="genders" :value="genderIdx" @change="onGenderPick">
        <view class="picker nb-input">{{ genders[genderIdx] }}</view>
      </picker>

      <text class="label">居住地址</text>
      <FieldInput v-model="address" placeholder="楼号、房间等" />

      <text class="section">机构登记</text>
      <text class="field-hint">机构名称按合作方提供填写，无需从列表选择</text>

      <text class="label">所属机构</text>
      <FieldInput
        v-model="orgName"
        placeholder="如：XX养老院、XX社区服务中心"
      />

      <text class="label">所在城市</text>
      <FieldInput v-model="district" placeholder="如：上海 · 浦东新区" />

      <text class="label">地图位置（大概）</text>
      <ElderLocationMapPicker v-model="mapPoint" :city-name="district" />

      <text class="label">居住情况</text>
      <FieldInput v-model="livingSituation" placeholder="如：与子女同住、机构养老" />

      <text class="label">健康概况</text>
      <FieldInput v-model="healthStatus" placeholder="如：总体良好、血压需关注" />

      <text class="label">行动能力</text>
      <FieldInput v-model="mobility" placeholder="如：行动便利、需搀扶" />

      <text class="section">紧急联系人</text>

      <text class="label">姓名</text>
      <FieldInput v-model="emergencyName" placeholder="紧急联系人姓名" />

      <text class="label">关系</text>
      <FieldInput v-model="emergencyRelation" placeholder="如：女儿" />

      <text class="label">电话</text>
      <FieldInput v-model="emergencyPhone" type="tel" placeholder="联系电话" />

      <text class="label">备注</text>
      <textarea
        v-model="notes"
        class="textarea nb-input"
        placeholder="运营备注（可选）"
      />

      <button class="btn-save nb-btn-primary" :loading="saving" @tap="save">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import ProfileAvatar from '../../components/ProfileAvatar.vue';
import H5EditableInput from '../../components/H5EditableInput.vue';
// #ifdef H5
import { H5NativeInput } from '../../components/h5-native-input';
// #endif
import ElderLocationMapPicker, { type ElderMapPoint } from '../../components/ElderLocationMapPicker.vue';
import {
  fetchOpsElderProfile,
  updateOpsElderProfile,
  uploadOpsElderAvatar,
  type OpsElderProfile,
} from '../../api/platform';
import { requireOpsSession, isOpsSessionActive } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';
import { isDemoMockEnabled } from '../../utils/demo-mock';
// #ifdef H5
import { syncDevicePreviewRoute } from '../../utils/device-preview';
// #endif

const genders = ['女', '男', '未填'];
const elderId = ref('');
const profile = ref<OpsElderProfile | null>(null);
const orgName = ref('');
const elderName = ref('');
const contactPhone = ref('');
const loginPhone = ref('');
const avatarUrl = ref('');
const ageText = ref('');
const genderIdx = ref(0);
const address = ref('');
const district = ref('');
const livingSituation = ref('');
const healthStatus = ref('');
const mobility = ref('');
const emergencyName = ref('');
const emergencyRelation = ref('');
const emergencyPhone = ref('');
const notes = ref('');
const mapPoint = ref<ElderMapPoint | null>(null);
const loading = ref(false);
const saving = ref(false);
const profileLoaded = ref(false);

// #ifdef H5
const FieldInput = H5NativeInput;
// #endif
// #ifndef H5
const FieldInput = H5EditableInput;
// #endif

onLoad((q) => {
  const id = String(q?.id || '');
  if (id !== elderId.value) {
    profileLoaded.value = false;
    profile.value = null;
  }
  elderId.value = id;
  ensureDesktopFullscreen();
  if (requireOpsSession()) void load();
});

function ensureDesktopFullscreen() {
  // #ifdef H5
  syncDevicePreviewRoute();
  if (isOpsSessionActive()) syncDevicePreviewRoute();
  // #endif
}

function syncForm(p: OpsElderProfile) {
  elderName.value = p.name || '';
  contactPhone.value = p.phone || p.loginPhone || '';
  loginPhone.value = p.loginPhone || '';
  avatarUrl.value = p.avatarUrl || '';
  ageText.value = p.age ? String(p.age) : '';
  const gIdx = genders.indexOf(p.gender || '');
  genderIdx.value = gIdx >= 0 ? gIdx : 0;
  address.value = p.address || '';
  district.value = p.district || '';
  livingSituation.value = p.livingSituation || '';
  healthStatus.value = p.healthStatus || '';
  mobility.value = p.mobility || '';
  emergencyName.value = p.emergencyContactName || '';
  emergencyRelation.value = p.emergencyContactRelation || '';
  emergencyPhone.value = p.emergencyContactPhone || '';
  notes.value = p.notes || '';
  orgName.value = p.orgName || '';
  if (p.latitude && p.longitude) {
    mapPoint.value = { lat: p.latitude, lng: p.longitude };
  } else {
    mapPoint.value = null;
  }
}

function onGenderPick(e: { detail: { value: string } }) {
  genderIdx.value = Number(e.detail.value);
}

async function pickAvatar() {
  if (!elderId.value || !profile.value?.userId) {
    if (!profile.value?.userId) {
      uni.showToast({ title: '未绑定登录账号', icon: 'none' });
    }
    return;
  }
  try {
    const pick = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject,
      });
    });
    const filePath = pick.tempFilePaths?.[0];
    if (!filePath) return;
    if (isDemoMockEnabled()) {
      avatarUrl.value = filePath;
      return;
    }
    const uploaded = await uploadOpsElderAvatar(elderId.value, filePath);
    avatarUrl.value = uploaded;
    uni.showToast({ title: '头像已更新', icon: 'success' });
  } catch (e) {
    const msg = pbErrorMessage(e);
    if (msg && !msg.includes('cancel')) {
      uni.showToast({ title: msg, icon: 'none' });
    }
  }
}

async function load() {
  if (!elderId.value || profileLoaded.value) return;
  loading.value = true;
  try {
    const p = await fetchOpsElderProfile(elderId.value);
    profile.value = p;
    syncForm(p);
    profileLoaded.value = true;
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!elderId.value || !profile.value) return;
  if (!orgName.value.trim()) {
    uni.showToast({ title: '请填写所属机构名称', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    const res = await updateOpsElderProfile(elderId.value, {
      name: elderName.value.trim(),
      phone: contactPhone.value.trim(),
      age: ageText.value ? Number(ageText.value) : 0,
      gender: genders[genderIdx.value],
      address: address.value.trim(),
      orgName: orgName.value.trim(),
      district: district.value.trim(),
      latitude: mapPoint.value?.lat,
      longitude: mapPoint.value?.lng,
      livingSituation: livingSituation.value.trim(),
      healthStatus: healthStatus.value.trim(),
      mobility: mobility.value.trim(),
      emergencyContactName: emergencyName.value.trim(),
      emergencyContactRelation: emergencyRelation.value.trim(),
      emergencyContactPhone: emergencyPhone.value.trim(),
      notes: notes.value.trim(),
    });
    profile.value = res.elder;
    uni.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    saving.value = false;
  }
}

onShow(() => {
  ensureDesktopFullscreen();
  if (!requireOpsSession()) return;
  if (!profileLoaded.value && elderId.value) void load();
});

onMounted(() => {
  ensureDesktopFullscreen();
  setTimeout(ensureDesktopFullscreen, 50);
  setTimeout(ensureDesktopFullscreen, 300);
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 48rpx;
}
.form-body {
  position: relative;
  z-index: 2;
  padding-bottom: 48rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 28rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted, #888);
}
.section {
  display: block;
  margin: 32rpx 0 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--nb-primary, #c45c26);
}
.avatar-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 16rpx;
  position: relative;
  z-index: 1;
}
.avatar-tap {
  flex-shrink: 0;
}
.basic-fields {
  position: relative;
  z-index: 4;
  isolation: isolate;
}
.avatar-meta {
  flex: 1;
  min-width: 0;
}
.avatar-hint {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-muted, #888);
}
.login-phone {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 500;
}
.field-hint {
  display: block;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
}
.label {
  display: block;
  margin: 20rpx 0 8rpx;
  font-size: 26rpx;
  font-weight: 500;
}
.input,
.picker,
.textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  background: var(--nb-surface, #fff);
}
.textarea {
  min-height: 160rpx;
}
.state {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
}
.btn-save {
  margin-top: 40rpx;
}
</style>

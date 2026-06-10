<template>
  <view class="page" :class="elderFontCls">
    <view v-if="onboarding" class="banner">首次登录 · 请完善老人资料</view>

    <text class="section">头像</text>
    <view class="avatar-row">
      <ProfileAvatar :avatar-url="avatarUrl" :name="name" @change="onAvatarChange" />
      <text class="avatar-hint">点击更换头像</text>
    </view>

    <text class="section">姓名</text>
    <input v-model="name" class="input nb-input" placeholder="如：张奶奶" />

    <text class="section">年龄</text>
    <input v-model="ageText" class="input nb-input" type="number" placeholder="如：78" />

    <text class="section">性别</text>
    <picker :range="genders" :value="genderIdx" @change="onGenderPick">
      <view class="picker nb-input">{{ genders[genderIdx] }}</view>
    </picker>

    <text class="section">所在区域</text>
    <input v-model="district" class="input nb-input" placeholder="如：浦东新区" />

    <text class="section">居住地址</text>
    <input v-model="address" class="input nb-input" placeholder="详细地址" />

    <text class="section">紧急联系人</text>
    <input v-model="emergencyName" class="input nb-input" placeholder="姓名" />
    <input v-model="emergencyRelation" class="input nb-input emergency" placeholder="关系，如：女儿" />
    <input v-model="emergencyPhone" class="input nb-input emergency" type="number" placeholder="联系电话" />

    <button class="btn" :loading="loading" @tap="save">保存</button>
    <button v-if="!onboarding" class="btn-outline" @tap="goBack">取消</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import ProfileAvatar from '../../components/ProfileAvatar.vue';
import { fetchElderSelfProfile, updateElderProfile } from '../../api/elder';
import { elderFontClass } from '../../utils/elder-accessibility';
import { finishProfileOnboarding } from '../../utils/profile-onboarding';
import { pbErrorMessage } from '../../utils/request';

const genders = ['女', '男'];
const name = ref('');
const avatarUrl = ref('');
const ageText = ref('');
const genderIdx = ref(0);
const district = ref('');
const address = ref('');
const emergencyName = ref('');
const emergencyRelation = ref('');
const emergencyPhone = ref('');
const loading = ref(false);
const onboarding = ref(false);
const elderFontCls = ref(elderFontClass());

onLoad((query) => {
  onboarding.value = query?.onboarding === '1';
});

onShow(async () => {
  elderFontCls.value = elderFontClass();
  try {
    const p = await fetchElderSelfProfile();
    name.value = p.name || '';
    avatarUrl.value = p.avatarUrl || '';
    ageText.value = p.age ? String(p.age) : '';
    const gIdx = genders.indexOf(p.gender || '');
    genderIdx.value = gIdx >= 0 ? gIdx : 0;
    district.value = p.district || '';
    address.value = p.address || '';
    emergencyName.value = p.emergencyContact?.name || '';
    emergencyRelation.value = p.emergencyContact?.relation || '';
    emergencyPhone.value = p.emergencyContact?.phone || '';
  } catch {
    /* ignore */
  }
});

function onAvatarChange(url: string) {
  avatarUrl.value = url;
}

function onGenderPick(e: { detail: { value: string } }) {
  genderIdx.value = Number(e.detail.value);
}

function goBack() {
  uni.navigateBack();
}

async function save() {
  if (!name.value.trim() || !district.value.trim() || !address.value.trim()) {
    uni.showToast({ title: '请填写姓名、区域与地址', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await updateElderProfile({
      name: name.value.trim(),
      age: Number(ageText.value) || undefined,
      gender: genders[genderIdx.value],
      district: district.value.trim(),
      address: address.value.trim(),
      emergencyContactName: emergencyName.value.trim(),
      emergencyContactRelation: emergencyRelation.value.trim(),
      emergencyContactPhone: emergencyPhone.value.trim(),
    });
    uni.showToast({ title: '已保存', icon: 'success' });
    if (onboarding.value) {
      setTimeout(() => finishProfileOnboarding('elder'), 500);
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
  font-size: 28rpx;
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  border-radius: var(--nb-radius-sm, 12rpx);
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
.picker {
  background: var(--nb-surface, #fff);
  padding: 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 16rpx;
}
.emergency {
  margin-top: 0;
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

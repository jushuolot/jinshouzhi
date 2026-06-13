<template>
  <view class="page">
    <view v-if="onboarding" class="banner">首次登录 · 请完善家属资料（付款方式可稍后再填）</view>

    <text class="section">头像</text>
    <view class="avatar-row">
      <ProfileAvatar :avatar-url="avatarUrl" :name="nickname" @change="onAvatarChange" />
      <text class="avatar-hint">点击更换头像</text>
    </view>

    <text class="section">显示名称</text>
    <FieldInput v-model="nickname" placeholder="如：张女士" />

    <text class="section">联系电话</text>
    <FieldInput v-model="contactPhone" type="tel" :maxlength="11" placeholder="11 位手机号" />

    <text class="section">所在区域</text>
    <FieldInput v-model="district" placeholder="如：浦东新区" />

    <text class="section">联系地址</text>
    <FieldInput v-model="address" placeholder="详细地址" />

    <text class="section">与老人关系</text>
    <FieldInput v-model="relationToElder" placeholder="如：女儿、儿子" />

    <PaymentAccountSection ref="paymentRef" role="family" deferrable @change="onPaymentChange" />

    <button class="btn" :loading="loading" @tap="save">保存</button>
    <button v-if="onboarding" class="btn-outline" @tap="skipOnboarding">先逛逛，稍后完善</button>
    <button v-if="!onboarding" class="btn-outline" @tap="goBack">取消</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import ProfileAvatar from '../../components/ProfileAvatar.vue';
import PaymentAccountSection from '../../components/PaymentAccountSection.vue';
import H5EditableInput from '../../components/H5EditableInput.vue';
import { fetchFamilyProfile, updateFamilyProfile } from '../../api/family';
import { finishProfileOnboarding } from '../../utils/profile-onboarding';
import { pbErrorMessage } from '../../utils/request';

const FieldInput = H5EditableInput;

const nickname = ref('');
const avatarUrl = ref('');
const contactPhone = ref('');
const district = ref('');
const address = ref('');
const relationToElder = ref('');
const loading = ref(false);
const onboarding = ref(false);
const paymentRef = ref<InstanceType<typeof PaymentAccountSection> | null>(null);
const profileLoaded = ref(false);

function onPaymentChange(_configured: boolean) {
  /* 付款方式可选，支付前再配置 */
}

onLoad(async (query) => {
  onboarding.value = query?.onboarding === '1';
  await loadProfile();
});

async function loadProfile() {
  if (profileLoaded.value) return;
  try {
    const p = await fetchFamilyProfile();
    nickname.value = p.nickname || '';
    avatarUrl.value = p.avatarUrl || '';
    contactPhone.value = p.contactPhone || '';
    district.value = p.district || '';
    address.value = p.address || '';
    relationToElder.value = p.relationToElder || '';
  } catch {
    /* ignore */
  } finally {
    profileLoaded.value = true;
  }
}

function onAvatarChange(url: string) {
  avatarUrl.value = url;
}

function goBack() {
  uni.navigateBack();
}

function skipOnboarding() {
  finishProfileOnboarding('family');
}

async function save() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请填写显示名称', icon: 'none' });
    return;
  }
  if (!contactPhone.value.trim() || !district.value.trim()) {
    uni.showToast({ title: '请填写联系电话与区域', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await updateFamilyProfile({
      nickname: nickname.value.trim(),
      contactPhone: contactPhone.value.trim(),
      district: district.value.trim(),
      address: address.value.trim(),
      relationToElder: relationToElder.value.trim() || '家属',
    });
    uni.showToast({ title: '已保存', icon: 'success' });
    if (onboarding.value) {
      setTimeout(() => finishProfileOnboarding('family'), 500);
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

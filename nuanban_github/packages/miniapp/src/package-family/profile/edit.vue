<template>
  <view class="page">
    <view v-if="onboarding" class="banner">首次登录 · 请完善家属资料</view>

    <text class="section">头像</text>
    <view class="avatar-row">
      <ProfileAvatar :avatar-url="avatarUrl" :name="nickname" @change="onAvatarChange" />
      <text class="avatar-hint">点击更换头像</text>
    </view>

    <text class="section">显示名称</text>
    <input v-model="nickname" class="input nb-input" placeholder="如：张女士" />

    <text class="section">联系电话</text>
    <input v-model="contactPhone" class="input nb-input" type="number" placeholder="11 位手机号" />

    <text class="section">所在区域</text>
    <input v-model="district" class="input nb-input" placeholder="如：浦东新区" />

    <text class="section">联系地址</text>
    <input v-model="address" class="input nb-input" placeholder="详细地址" />

    <text class="section">与老人关系</text>
    <input v-model="relationToElder" class="input nb-input" placeholder="如：女儿、儿子" />

    <PaymentAccountSection ref="paymentRef" role="family" @change="onPaymentChange" />

    <button class="btn" :loading="loading" @tap="save">保存</button>
    <button v-if="!onboarding" class="btn-outline" @tap="goBack">取消</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import ProfileAvatar from '../../components/ProfileAvatar.vue';
import PaymentAccountSection from '../../components/PaymentAccountSection.vue';
import { fetchFamilyProfile, updateFamilyProfile } from '../../api/family';
import { finishProfileOnboarding } from '../../utils/profile-onboarding';
import { pbErrorMessage } from '../../utils/request';

const nickname = ref('');
const avatarUrl = ref('');
const contactPhone = ref('');
const district = ref('');
const address = ref('');
const relationToElder = ref('');
const loading = ref(false);
const onboarding = ref(false);
const paymentConfigured = ref(false);
const paymentRef = ref<InstanceType<typeof PaymentAccountSection> | null>(null);

function onPaymentChange(configured: boolean) {
  paymentConfigured.value = configured;
}

onLoad((query) => {
  onboarding.value = query?.onboarding === '1';
});

onShow(async () => {
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
  }
});

function onAvatarChange(url: string) {
  avatarUrl.value = url;
}

function goBack() {
  uni.navigateBack();
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
  if (onboarding.value && !paymentConfigured.value && !paymentRef.value?.isConfigured()) {
    uni.showToast({ title: '请配置扫呗付款账户', icon: 'none' });
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
.input {
  background: var(--nb-surface, #fff);
  padding: 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
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

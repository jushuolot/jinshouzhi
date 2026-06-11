<template>
  <view class="verification-section">
    <view class="section-head">
      <text class="section-title">实名核验照</text>
      <text class="section-badge">仅学生</text>
    </view>
    <text class="section-desc">请使用相机拍摄本人正面照，供平台核验身份。卡通头像对外展示，此照片不对老人/家属公开。</text>

    <view class="photo-frame" @tap="onCapture">
      <image v-if="displayUrl" :src="displayUrl" class="photo" mode="aspectFill" />
      <view v-else class="placeholder">
        <text class="cam-icon">📷</text>
        <text class="cam-text">点击拍摄核验照</text>
        <text class="cam-sub">需使用相机 · 不支持相册</text>
      </view>
      <view v-if="displayUrl && editable" class="retake">
        <text>重新拍摄</text>
      </view>
    </view>

    <text v-if="displayUrl" class="status ok">✓ 已上传核验照</text>
    <text v-else class="status warn">尚未上传 · 完成核验后可优先接单</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { captureAndUploadVerificationPhoto } from '../utils/verification-photo';
import { pbErrorMessage } from '../utils/request';

const props = withDefaults(
  defineProps<{
    photoUrl?: string;
    editable?: boolean;
  }>(),
  { editable: true },
);

const emit = defineEmits<{ change: [url: string] }>();

const localUrl = ref('');
const uploading = ref(false);

const displayUrl = computed(() => localUrl.value || props.photoUrl || '');

watch(
  () => props.photoUrl,
  (v) => {
    if (v) localUrl.value = v;
  },
  { immediate: true },
);

async function onCapture() {
  if (!props.editable || uploading.value) return;
  uploading.value = true;
  try {
    const url = await captureAndUploadVerificationPhoto();
    localUrl.value = url;
    emit('change', url);
    uni.showToast({ title: '核验照已上传', icon: 'success' });
  } catch (e) {
    const msg = pbErrorMessage(e);
    if (msg && !msg.includes('cancel')) {
      uni.showToast({ title: msg, icon: 'none' });
    }
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.verification-section {
  background: var(--nb-surface, #fff);
  border-radius: var(--nb-radius-sm, 12rpx);
  padding: 28rpx;
  margin-bottom: 24rpx;
}
.section-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--nb-text, #333);
}
.section-badge {
  font-size: 20rpx;
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.section-desc {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-muted, #888);
  line-height: 1.5;
  margin-bottom: 20rpx;
}
.photo-frame {
  position: relative;
  width: 100%;
  height: 420rpx;
  border-radius: var(--nb-radius-md, 16rpx);
  overflow: hidden;
  background: #fafafa;
  border: 2rpx dashed var(--nb-border-dashed, #e8c4a8);
}
.photo {
  width: 100%;
  height: 100%;
}
.placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}
.cam-icon {
  font-size: 64rpx;
}
.cam-text {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--nb-text, #333);
}
.cam-sub {
  font-size: 22rpx;
  color: var(--nb-text-muted, #aaa);
}
.retake {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  padding: 10rpx 20rpx;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 24rpx;
  border-radius: 999rpx;
}
.status {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
}
.status.ok {
  color: #2a9d8f;
}
.status.warn {
  color: #c45c26;
}
</style>

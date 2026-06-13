<template>
  <view class="verification-section" :class="{ compact }">
    <view v-if="!compact" class="section-head">
      <text class="section-title">实名核验照</text>
    </view>

    <view class="photo-frame" @tap="onCapture" @click="onCapture">
      <image v-if="displayUrl" :src="displayUrl" class="photo" mode="aspectFill" />
      <view v-else class="placeholder">
        <text class="cam-icon">📷</text>
        <text class="cam-text">{{ placeholderText }}</text>
      </view>
      <view v-if="displayUrl && editable" class="retake">
        <text>重拍</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CameraPickResult } from '../utils/camera-picker';
import { captureAndUploadVerificationPhoto, captureVerificationPreview } from '../utils/verification-photo';
import { pbErrorMessage } from '../utils/request';

const props = withDefaults(
  defineProps<{
    photoUrl?: string;
    editable?: boolean;
    compact?: boolean;
    /** 注册等场景：先本地预览，身份创建后再上传 */
    uploadOnCapture?: boolean;
  }>(),
  { editable: true, compact: false, uploadOnCapture: true },
);

const emit = defineEmits<{ change: [url: string]; pick: [pick: CameraPickResult] }>();

const localUrl = ref('');
const uploading = ref(false);

const displayUrl = computed(() => localUrl.value || props.photoUrl || '');

const placeholderText = computed(() => {
  if (typeof navigator !== 'undefined' && !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) {
    return '点击选择或拍摄核验照';
  }
  return '点击拍摄核验照';
});

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
    if (props.uploadOnCapture) {
      const url = await captureAndUploadVerificationPhoto();
      localUrl.value = url;
      emit('change', url);
      uni.showToast({ title: '核验照已上传', icon: 'success' });
    } else {
      const pick = await captureVerificationPreview();
      localUrl.value = pick.previewUrl;
      emit('change', pick.previewUrl);
      emit('pick', pick);
      uni.showToast({ title: '已拍摄，提交注册后上传', icon: 'none' });
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : pbErrorMessage(e);
    if (raw && !/cancel|取消/i.test(raw)) {
      uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
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
.verification-section.compact {
  padding: 0;
  margin: 0;
  background: transparent;
  flex: 1;
  min-width: 0;
}
.section-head {
  margin-bottom: 12rpx;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--nb-text, #333);
}
.photo-frame {
  position: relative;
  width: 100%;
  height: 420rpx;
  border-radius: var(--nb-radius-md, 16rpx);
  overflow: hidden;
  background: #fafafa;
  border: 2rpx dashed var(--nb-border-dashed, #e8c4a8);
  cursor: pointer;
}
.compact .photo-frame {
  height: 280rpx;
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
  gap: 8rpx;
}
.cam-icon {
  font-size: 48rpx;
}
.cam-text {
  font-size: 26rpx;
  color: var(--nb-text-muted, #999);
}
.retake {
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  padding: 8rpx 16rpx;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 22rpx;
  border-radius: 999rpx;
}
</style>

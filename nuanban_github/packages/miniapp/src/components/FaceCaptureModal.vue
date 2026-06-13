<template>
  <view v-if="visible" class="face-capture" @touchmove.stop.prevent>
    <view ref="mountRef" class="video-mount" />

    <view class="mask">
      <view class="face-oval" />
    </view>

    <view class="top-bar">
      <text class="top-title">实名核验拍摄</text>
      <text class="top-hint">请将面部对准框内，保持光线充足</text>
      <text class="top-sub">仅拍摄框内区域 · 不支持相册</text>
    </view>

    <view class="bottom-bar">
      <view class="btn-cancel" @tap="onCancel">取消</view>
      <view class="btn-shutter" @tap="onCapture">
        <view class="shutter-inner" />
      </view>
      <view class="btn-placeholder" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';
import {
  FACE_FRAME,
  cancelFaceCapture,
  canvasToPickResult,
  faceCaptureVisible,
  finishFaceCapture,
  mapContainerRectToVideo,
  validateCapturedImage,
} from '../utils/face-capture';

const visible = faceCaptureVisible;
const mountRef = ref<HTMLElement | null>(null);

let videoEl: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
let starting = false;

async function startCamera() {
  if (starting || stream) return;
  starting = true;
  try {
    await nextTick();
    const mount = mountRef.value as unknown as HTMLElement | null;
    if (!mount) throw new Error('相机初始化失败');

    const video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.autoplay = true;
    video.muted = true;
    video.className = 'face-capture-video';
    mount.appendChild(video);
    videoEl = video;

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    stopCamera();
    cancelFaceCapture(err instanceof Error ? err.message : '无法打开相机');
    uni.showToast({ title: '无法打开相机，请检查权限', icon: 'none' });
  } finally {
    starting = false;
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl.remove();
    videoEl = null;
  }
}

async function onCapture() {
  if (!videoEl) return;
  const mount = mountRef.value as unknown as HTMLElement | null;
  if (!mount) return;

  const rect = mount.getBoundingClientRect();
  const fw = rect.width * FACE_FRAME.w;
  const fh = rect.height * FACE_FRAME.h;
  const fx = rect.width * FACE_FRAME.cx - fw / 2;
  const fy = rect.height * FACE_FRAME.cy - fh / 2;

  const mapped = mapContainerRectToVideo(videoEl, rect.width, rect.height, {
    x: fx,
    y: fy,
    w: fw,
    h: fh,
  });
  if (!mapped) {
    uni.showToast({ title: '相机未就绪，请稍候', icon: 'none' });
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(mapped.sw);
  canvas.height = Math.round(mapped.sh);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(
    videoEl,
    mapped.sx,
    mapped.sy,
    mapped.sw,
    mapped.sh,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  if (!validateCapturedImage(canvas)) {
    uni.showToast({ title: '请将面部对准框内再拍摄', icon: 'none' });
    return;
  }

  try {
    const result = await canvasToPickResult(canvas);
    stopCamera();
    finishFaceCapture(result);
  } catch {
    uni.showToast({ title: '拍摄失败，请重试', icon: 'none' });
  }
}

function onCancel() {
  stopCamera();
  cancelFaceCapture('cancel');
}

watch(visible, (show) => {
  if (show) void startCamera();
  else stopCamera();
});

onUnmounted(() => stopCamera());
</script>

<style scoped>
.face-capture {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #000;
  display: flex;
  flex-direction: column;
}
.video-mount {
  position: absolute;
  inset: 0;
}
:deep(.face-capture-video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.face-oval {
  width: 72vw;
  height: 92vw;
  max-width: 320px;
  max-height: 410px;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.58);
}
.top-bar {
  position: relative;
  z-index: 2;
  padding: calc(24rpx + env(safe-area-inset-top)) 32rpx 24rpx;
  text-align: center;
}
.top-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
}
.top-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.92);
}
.top-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
}
.bottom-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 48rpx calc(48rpx + env(safe-area-inset-bottom));
}
.btn-cancel {
  width: 120rpx;
  text-align: center;
  font-size: 30rpx;
  color: #fff;
}
.btn-placeholder {
  width: 120rpx;
}
.btn-shutter {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shutter-inner {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #fff;
}
</style>

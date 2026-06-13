<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import './styles/theme.css';
// #ifdef H5
import FaceCaptureModal from './components/FaceCaptureModal.vue';
import { initDevicePreview, syncDevicePreviewRoute } from './utils/device-preview';
// #endif

onLaunch(() => {
  // #ifdef H5
  // 等 Vue 挂载后再套手机框，避免白屏；demo-tour 等路由全屏
  setTimeout(() => {
    initDevicePreview();
    syncDevicePreviewRoute();
  }, 300);
  // 路由就绪后再同步一次（避免 init 时 hash 尚未写入）
  setTimeout(() => syncDevicePreviewRoute(), 900);
  // #endif
});
</script>

<template>
  <!-- #ifdef H5 -->
  <FaceCaptureModal />
  <!-- #endif -->
</template>

<style>
/* 全局主题见 styles/theme.css */
</style>

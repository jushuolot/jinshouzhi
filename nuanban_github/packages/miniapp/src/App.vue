<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import './styles/theme.css';
// #ifdef H5
import { initDevicePreview } from './utils/device-preview';
// #endif

onLaunch(() => {
  // #ifdef H5
  // 等 Vue 挂载后再套手机框，避免白屏；god-view 路由全屏
  setTimeout(() => initDevicePreview(), 300);
  // #endif
});
</script>

<style>
/* 全局主题见 styles/theme.css */
</style>

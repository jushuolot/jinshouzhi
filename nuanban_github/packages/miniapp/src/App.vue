<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
// #ifdef H5
import { initDevicePreview } from './utils/device-preview';
// #endif

onLaunch(() => {
  // #ifdef H5
  setTimeout(() => initDevicePreview(), 0);
  // #endif
});
</script>

<style>
page {
  background-color: #f5f5f5;
  font-size: 16px;
}
page.elder-mode {
  font-size: 18px;
}
</style>

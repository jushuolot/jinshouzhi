<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
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
page {
  background-color: #f5f5f5;
  font-size: 16px;
}
page.elder-mode {
  font-size: 18px;
}
/* god-view 桌面全屏，避免手机框内白屏/滚不动 */
page[data-page='pages/common/god-view'],
page[data-page='pages/common/demo-tour'] {
  background-color: #1a1a2e;
}
</style>

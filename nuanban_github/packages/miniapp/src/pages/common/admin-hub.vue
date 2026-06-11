<template>
  <view class="redirect" />
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { OPS_HOME_PATH, requireOpsSession } from '../../utils/ops-mode';

onShow(() => {
  if (!requireOpsSession()) return;
  uni.redirectTo({ url: OPS_HOME_PATH });
});
</script>

<style scoped>
.redirect {
  min-height: 100vh;
  background: var(--nb-page-bg, #f5f5f5);
}
</style>

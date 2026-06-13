<template>
  <view class="redirect" />
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';

/** 协议确认已合并至登录页，旧链接自动跳转 */
onLoad((query) => {
  const parts: string[] = [];
  if (query?.from) parts.push(`from=${query.from}`);
  const q = parts.length ? `?${parts.join('&')}` : '';
  uni.redirectTo({ url: `/pages/common/login${q}` });
});
</script>

<style scoped>
.redirect {
  min-height: 100vh;
  background: #fff;
}
</style>

<template>
  <view class="page elder-mode" :class="fontClass">
    <text class="title">家属绑定码</text>
    <text class="sub">请家属在「绑定老人」页输入下方绑定码，或打开绑定链接</text>

    <view class="code-box">
      <text class="code">{{ bindCode }}</text>
      <button class="copy-btn" size="mini" @tap="copyCode">复制绑定码</button>
    </view>

    <view v-if="qrUrl" class="qr-wrap">
      <image class="qr" :src="qrUrl" mode="aspectFit" />
      <text class="qr-hint">扫码打开绑定页（需联网）</text>
    </view>

    <text class="link-label">绑定链接（可转发家属）</text>
    <text class="link-text selectable">{{ bindLink }}</text>
    <button class="btn" @tap="copyLink">复制链接</button>

    <RoleTabBar role="elder" current="/package-elder/profile" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import { fetchElderStats } from '../api/elder';
import { elderFontClass } from '../utils/elder-accessibility';
import { encodeElderBindCode, familyBindPageUrl } from '../utils/bind-code';

const elderId = ref('elder-zhang');
const fontClass = computed(() => elderFontClass());

const bindCode = computed(() => encodeElderBindCode(elderId.value));

const bindLink = computed(() => {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const base = window.location.href.split('#')[0];
      return `${base}#${familyBindPageUrl(elderId.value)}`;
    }
  } catch {
    /* ignore */
  }
  return `#${familyBindPageUrl(elderId.value)}`;
});

const qrUrl = computed(() => {
  const data = encodeURIComponent(bindLink.value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}`;
});

onShow(async () => {
  try {
    const st = await fetchElderStats();
    if (st.elderProfileId) elderId.value = st.elderProfileId;
  } catch {
    /* demo fallback */
  }
});

function copyCode() {
  uni.setClipboardData({ data: bindCode.value });
}

function copyLink() {
  uni.setClipboardData({ data: bindLink.value });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #888;
}
.code-box {
  margin-top: 32rpx;
  background: #fff;
  padding: 32rpx;
  border-radius: 16rpx;
  text-align: center;
}
.code {
  display: block;
  font-size: 28rpx;
  word-break: break-all;
  color: #333;
  font-family: monospace;
}
.copy-btn {
  margin-top: 20rpx;
  background: #fff5ef;
  color: #c45c26;
}
.qr-wrap {
  margin-top: 32rpx;
  text-align: center;
  background: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
}
.qr {
  width: 200px;
  height: 200px;
}
.qr-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #999;
}
.link-label {
  display: block;
  margin-top: 32rpx;
  font-size: 26rpx;
  color: #666;
}
.link-text {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #888;
  word-break: break-all;
  background: #fff;
  padding: 16rpx;
  border-radius: 8rpx;
}
.btn {
  margin-top: 24rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
.page.elder-large .title {
  font-size: 52rpx;
}
.page.elder-large .code {
  font-size: 36rpx;
}
</style>

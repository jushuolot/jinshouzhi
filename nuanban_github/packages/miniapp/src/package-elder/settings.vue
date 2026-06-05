<template>
  <view class="page elder-mode" :class="fontClass">
    <text class="title">无障碍设置</text>
    <view class="card">
      <view class="row">
        <view>
          <text class="label">大字号模式</text>
          <text class="desc">放大首页与列表文字，便于长辈阅读</text>
        </view>
        <switch :checked="largeFont" color="#c45c26" @change="onToggle" />
      </view>
    </view>
    <view class="preview" :class="{ large: largeFont }">
      <text>预览文字：找陪护 · 一键求助</text>
    </view>
    <button class="btn" @tap="goHome">返回首页</button>
    <RoleTabBar role="elder" current="/package-elder/profile" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import RoleTabBar from '../components/RoleTabBar.vue';
import { elderFontClass, isElderLargeFont, setElderLargeFont } from '../utils/elder-accessibility';

const largeFont = ref(isElderLargeFont());
const fontClass = computed(() => elderFontClass());

onShow(() => {
  largeFont.value = isElderLargeFont();
});

function onToggle(e: { detail: { value: boolean } }) {
  largeFont.value = e.detail.value;
  setElderLargeFont(e.detail.value);
  uni.showToast({ title: e.detail.value ? '已开启大字号' : '已关闭', icon: 'none' });
}

function goHome() {
  uni.redirectTo({ url: '/package-elder/home' });
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
  margin-bottom: 24rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.label {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}
.desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #888;
}
.preview {
  margin-top: 32rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
}
.preview.large {
  font-size: 40rpx;
  font-weight: 600;
}
.btn {
  margin-top: 32rpx;
  background: #c45c26;
  color: #fff;
}
.page.elder-large .title {
  font-size: 52rpx;
}
.page.elder-large .label {
  font-size: 40rpx;
}
</style>

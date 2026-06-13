<template>
  <view class="page nb-page">
    <view class="hero nb-hero">
      <text class="hero-title">产品模块地图</text>
      <text class="hero-sub">三端分包 · 一目了然 · 点按直达</text>
    </view>

    <view class="pillars">
      <view v-for="p in pillars" :key="p.title" class="pillar">
        <text class="pillar-icon">{{ p.icon }}</text>
        <text class="pillar-title">{{ p.title }}</text>
        <text class="pillar-desc">{{ p.desc }}</text>
      </view>
    </view>

    <view v-for="group in groups" :key="group.id" class="group">
      <view class="group-head" :style="{ borderLeftColor: group.color }">
        <text class="group-title">{{ group.title }}</text>
        <text class="group-sub">{{ group.subtitle }}</text>
      </view>
      <view class="grid">
        <view
          v-for="entry in group.entries"
          :key="entry.id"
          class="tile nb-card"
          :class="{ highlight: entry.highlight }"
          @tap="go(entry.path)"
        >
          <text class="tile-icon">{{ entry.icon }}</text>
          <text class="tile-title">{{ entry.title }}</text>
          <text class="tile-desc">{{ entry.desc }}</text>
          <text v-if="entry.account" class="tile-account">{{ entry.account }}</text>
        </view>
      </view>
    </view>

    <view class="footer-card nb-card" @tap="goSecurity">
      <text class="footer-icon">🔒</text>
      <view>
        <text class="footer-title">安全中心</text>
        <text class="footer-desc">传输加密 · 隐私与权限说明</text>
      </view>
      <text class="chev">›</text>
    </view>
    <OpsSessionBar />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { MODULE_GROUPS, PRODUCT_PILLARS } from '../../config/modules';
import { openOpsMode, requireOpsSession } from '../../utils/ops-mode';
import OpsSessionBar from '../../components/OpsSessionBar.vue';

onShow(() => {
  requireOpsSession();
});

const pillars = PRODUCT_PILLARS;

/** 运营模式入口始终展示，避免验收时找不到 */
const groups = computed(() => MODULE_GROUPS);

function go(path: string) {
  if (path.includes('ops-gate') || path.includes('admin-hub') || path.includes('ops-home')) {
    openOpsMode();
    return;
  }
  uni.navigateTo({ url: path });
}

function goSecurity() {
  uni.navigateTo({ url: '/pages/common/security' });
}
</script>

<style scoped>
.hero-title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: var(--nb-text);
}
.hero-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
}
.pillars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-bottom: 28rpx;
}
.pillar {
  background: var(--nb-surface);
  border-radius: var(--nb-radius-md);
  padding: 20rpx;
  border: 2rpx solid var(--nb-border);
  box-shadow: var(--nb-shadow-soft);
}
.pillar-icon {
  font-size: 32rpx;
}
.pillar-title {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
}
.pillar-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
  line-height: 1.4;
}
.group {
  margin-bottom: 28rpx;
}
.group-head {
  border-left: 8rpx solid var(--nb-primary);
  padding-left: 16rpx;
  margin-bottom: 16rpx;
}
.group-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}
.group-sub {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-muted);
  margin-top: 4rpx;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}
.tile {
  padding: 24rpx 20rpx;
  margin-bottom: 0;
}
.tile.highlight {
  border-color: var(--nb-border-dashed);
  background: var(--nb-primary-soft);
}
.tile-icon {
  font-size: 36rpx;
}
.tile-title {
  display: block;
  margin-top: 10rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.tile-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--nb-text-secondary);
  line-height: 1.4;
}
.tile-account {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: var(--nb-primary);
}
.footer-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}
.footer-icon {
  font-size: 40rpx;
}
.footer-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.footer-desc {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-muted);
  margin-top: 4rpx;
}
.chev {
  margin-left: auto;
  font-size: 36rpx;
  color: var(--nb-text-muted);
}
</style>

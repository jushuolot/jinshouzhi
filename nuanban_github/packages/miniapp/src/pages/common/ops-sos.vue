<template>
  <view class="page nb-page">
    <text class="title">SOS 求助中心</text>
    <text class="sub">老人一键求助 · 跟进家属/同学确认</text>

    <ListSearchBar v-model="searchKeyword" placeholder="搜索老人、求助内容…" />

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!shown.length" class="state nb-card">
      <text class="empty-icon">✓</text>
      <text>{{ searchKeyword ? '无匹配 SOS' : '当前无活跃 SOS' }}</text>
    </view>

    <view v-for="a in shown" :key="a.id" class="alert-card">
      <view class="alert-head">
        <text class="alert-icon">🆘</text>
        <view class="alert-main">
          <text class="alert-title">{{ a.elderName || '老人' }}</text>
          <text class="alert-msg">{{ a.message }}</text>
          <text class="alert-time">{{ formatTime(a.createdAt) }}</text>
        </view>
      </view>
      <text class="hint">家属端 / 学生端可确认知晓 · 运营仅监控</text>
    </view>

    <button class="btn-back" @tap="goHome">返回概览</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ListSearchBar from '../../components/ListSearchBar.vue';
import { fetchOpsSosActive, type OpsSosAlert } from '../../api/platform';
import { matchListKeyword } from '../../utils/list-search';
import { formatRelativeTime } from '../../utils/format-time';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';

const list = ref<OpsSosAlert[]>([]);
const searchKeyword = ref('');
const loading = ref(false);

const shown = computed(() =>
  list.value.filter((a) =>
    matchListKeyword(searchKeyword.value, [a.elderName, a.message, a.id, a.elderId, a.status]),
  ),
);

function formatTime(iso: string) {
  return formatRelativeTime(iso);
}

function goHome() {
  uni.redirectTo({ url: '/pages/common/ops-home' });
}

async function reload() {
  loading.value = true;
  try {
    list.value = await fetchOpsSosActive();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!requireOpsSession()) return;
  void reload();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 24rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.state {
  text-align: center;
  padding: 60rpx 24rpx;
  color: var(--nb-text-muted);
}
.empty-icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 12rpx;
  color: #4caf50;
}
.alert-card {
  background: #fff5f5;
  border: 1rpx solid #ffcdd2;
  border-radius: var(--nb-radius-md);
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.alert-head {
  display: flex;
  gap: 12rpx;
}
.alert-icon {
  font-size: 36rpx;
}
.alert-main {
  flex: 1;
}
.alert-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #c62828;
}
.alert-msg {
  display: block;
  margin-top: 6rpx;
  font-size: 26rpx;
}
.alert-time {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999;
}
.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted);
}
.btn-back {
  margin-top: 32rpx;
  background: var(--nb-page-bg, #f5f5f5);
  color: var(--nb-text-secondary);
  font-size: 28rpx;
}
</style>

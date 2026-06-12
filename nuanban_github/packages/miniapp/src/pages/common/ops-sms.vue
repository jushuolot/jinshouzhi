<template>
  <view class="page nb-page">
    <text class="title">短信发件箱</text>
    <text class="sub">平台自建验证码通道 · 备案期人工核对（无第三方短信）</text>

    <button class="btn" size="mini" :loading="loading" @tap="reload">刷新</button>

    <view v-if="!list.length && !loading" class="empty">暂无待发记录</view>
    <view v-for="row in list" :key="row.sentAt + row.phone" class="row nb-card">
      <text class="phone">{{ row.phone }}</text>
      <text class="code">{{ row.code }}</text>
      <text class="meta">{{ formatTime(row.sentAt) }} · {{ row.channel }}</text>
    </view>

    <OpsTabBar current="/pages/common/ops-sms" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import OpsTabBar from '../../components/OpsTabBar.vue';
import { fetchSmsOutbox } from '../../api/captcha-sms';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';

const OPS_KEY = 'nuanban2026';
const list = ref<Array<{ phone: string; code: string; sentAt: string; channel: string }>>([]);
const loading = ref(false);

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

async function reload() {
  loading.value = true;
  try {
    const res = await fetchSmsOutbox(OPS_KEY);
    list.value = res.list || [];
  } catch (e) {
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
  padding: 24rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 20rpx;
  font-size: 24rpx;
  color: #888;
  line-height: 1.5;
}
.btn {
  margin-bottom: 20rpx;
}
.empty {
  padding: 40rpx;
  text-align: center;
  color: #999;
}
.row {
  margin-bottom: 16rpx;
  padding: 20rpx;
}
.phone {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.code {
  display: block;
  margin-top: 8rpx;
  font-size: 40rpx;
  letter-spacing: 8rpx;
  color: #c45c26;
}
.meta {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
</style>

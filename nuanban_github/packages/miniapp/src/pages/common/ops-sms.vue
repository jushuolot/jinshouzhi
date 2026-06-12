<template>
  <view class="page nb-page">
    <text class="title">短信发件箱</text>
    <text class="sub">平台自建验证码通道 · 备案期人工核对（无第三方短信）</text>

    <ListSearchBar v-model="searchKeyword" placeholder="搜索手机号或验证码…" />

    <button class="btn" size="mini" :loading="loading" @tap="reload">刷新</button>

    <view v-if="!shown.length && !loading" class="empty">
      {{ searchKeyword ? '无匹配短信' : '暂无待发记录' }}
    </view>
    <view v-for="row in shown" :key="row.sentAt + row.phone" class="row nb-card">
      <text class="phone">{{ row.phone }}</text>
      <text class="code">{{ row.code }}</text>
      <text class="meta">{{ formatTime(row.sentAt) }} · {{ row.channel }}</text>
    </view>

    <OpsTabBar current="/pages/common/ops-sms" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ListSearchBar from '../../components/ListSearchBar.vue';
import OpsTabBar from '../../components/OpsTabBar.vue';
import { matchListKeyword } from '../../utils/list-search';
import { fetchSmsOutbox } from '../../api/captcha-sms';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';

const OPS_KEY = 'nuanban2026';
const list = ref<Array<{ phone: string; code: string; sentAt: string; channel: string }>>([]);
const searchKeyword = ref('');
const loading = ref(false);

const shown = computed(() =>
  list.value.filter((row) => matchListKeyword(searchKeyword.value, [row.phone, row.code, row.channel])),
);

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

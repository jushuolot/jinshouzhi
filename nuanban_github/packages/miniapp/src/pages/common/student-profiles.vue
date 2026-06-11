<template>
  <view class="page nb-page">
    <text class="title">学生资料管理</text>
    <text class="sub">查看学生卡通头像与实名核验照 · 仅运营模式</text>

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!list.length" class="state">暂无学生资料</view>

    <view v-for="s in list" :key="s.userId" class="card">
      <view class="card-head">
        <image :src="avatarUrl(s)" class="avatar" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ s.displayName || s.nickname }}</text>
          <text class="meta">{{ s.schoolName || '未填学校' }} · {{ statusLabel(s.status) }}</text>
          <text class="meta">{{ s.email }}</text>
          <text v-if="s.major" class="meta">{{ s.major }} · {{ s.grade || '-' }}</text>
        </view>
      </view>

      <view class="verify-block">
        <text class="verify-label">实名核验照</text>
        <image
          v-if="s.verificationPhotoUrl"
          :src="s.verificationPhotoUrl"
          class="verify-photo"
          mode="aspectFill"
          @tap="preview(s.verificationPhotoUrl)"
        />
        <view v-else class="verify-empty">未上传</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchOpsStudentProfiles, type OpsStudentProfile } from '../../api/platform';
import { resolveCartoonAvatarUrl } from '../../utils/cartoon-avatars';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';

const list = ref<OpsStudentProfile[]>([]);
const loading = ref(false);

function avatarUrl(s: OpsStudentProfile) {
  if (s.avatarUrl) return s.avatarUrl;
  return resolveCartoonAvatarUrl(s.cartoonAvatarId || s.displayName || s.nickname);
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    active: '已通过',
    pending: '审核中',
    rejected: '已拒绝',
    disabled: '已禁用',
  };
  return map[status] || status;
}

function preview(url: string) {
  uni.previewImage({ urls: [url], current: url });
}

async function reload() {
  loading.value = true;
  try {
    list.value = await fetchOpsStudentProfiles();
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
  background: var(--nb-page-bg, #f5f5f5);
  padding: 24rpx;
  padding-bottom: 48rpx;
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
  color: var(--nb-text-muted, #888);
}
.state {
  text-align: center;
  padding: 80rpx 0;
  color: var(--nb-text-muted, #999);
  font-size: 28rpx;
}
.card {
  background: var(--nb-surface, #fff);
  border-radius: var(--nb-radius-sm, 12rpx);
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.card-head {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
  background: var(--nb-primary-soft, #fff5ef);
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}
.meta {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted, #888);
}
.verify-block {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 16rpx;
}
.verify-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.verify-photo {
  width: 100%;
  height: 360rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  background: #fafafa;
}
.verify-empty {
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: var(--nb-radius-sm, 12rpx);
  color: var(--nb-text-muted, #bbb);
  font-size: 26rpx;
  border: 2rpx dashed #eee;
}
</style>

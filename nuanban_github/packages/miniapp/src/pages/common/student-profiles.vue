<template>
  <view class="page nb-page">
    <text class="title">学生资料审核</text>
    <text class="sub">核验照 · 学校 · 通过后可接单 · 共 {{ totalCount }} 人</text>
    <view v-if="isMockData" class="mock-hint">
      <text>当前为演示 Mock（约 9 人）。万人压测数据在 PocketBase，请本地 VITE_DEMO_MOCK=false 联调查看。</text>
    </view>

    <view class="filter-row">
      <view
        v-for="f in filters"
        :key="f.key"
        class="filter-chip"
        :class="{ active: filter === f.key }"
        @tap="filter = f.key"
      >
        {{ f.label }}
        <text v-if="f.count" class="chip-badge">{{ f.count }}</text>
      </view>
    </view>

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!filteredList.length" class="state">暂无{{ filterLabel }}学生</view>

    <view v-for="s in filteredList" :key="s.userId" class="card">
      <view class="card-head">
        <image :src="avatarUrl(s)" class="avatar" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ s.displayName || s.nickname }}</text>
          <text class="meta">{{ s.schoolName || '未填学校' }} · {{ s.gender || '未填' }} · {{ statusLabel(s.status) }}</text>
          <text class="meta">{{ s.email }}</text>
          <text v-if="s.major" class="meta">{{ s.major }} · {{ s.grade || '-' }}</text>
        </view>
        <text class="status-tag" :class="'st-' + s.status">{{ statusLabel(s.status) }}</text>
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

      <view v-if="s.status === 'pending'" class="actions">
        <button
          class="btn-approve"
          size="mini"
          :loading="acting === s.userId + '-ok'"
          @tap="setStatus(s.userId, 'active')"
        >
          通过
        </button>
        <button
          class="btn-reject"
          size="mini"
          :loading="acting === s.userId + '-no'"
          @tap="setStatus(s.userId, 'rejected')"
        >
          拒绝
        </button>
      </view>
    </view>

    <button v-if="hasMore" class="btn-more" :loading="loadingMore" @tap="loadMore">
      加载更多（已显示 {{ list.length }} / {{ totalCount }}）
    </button>

    <OpsTabBar current="/pages/common/student-profiles" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import OpsTabBar from '../../components/OpsTabBar.vue';
import {
  fetchOpsStudentProfiles,
  updateOpsStudentStatus,
  type OpsStudentProfile,
} from '../../api/platform';
import { resolveCartoonAvatarUrl } from '../../utils/cartoon-avatars';
import { requireOpsSession } from '../../utils/ops-mode';
import { isDemoMockEnabled } from '../../utils/demo-mock';
import { pbErrorMessage } from '../../utils/request';

const list = ref<OpsStudentProfile[]>([]);
const totalCount = ref(0);
const page = ref(1);
const hasMore = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const acting = ref('');
const filter = ref<'all' | 'pending' | 'active'>('all');
const isMockData = isDemoMockEnabled();

onLoad((q) => {
  const f = String(q?.filter || '');
  if (f === 'pending' || f === 'active') filter.value = f;
});

const filters = computed(() => {
  const pending = list.value.filter((s) => s.status === 'pending').length;
  const active = list.value.filter((s) => s.status === 'active').length;
  return [
    { key: 'all' as const, label: '全部', count: totalCount.value || list.value.length || 0 },
    { key: 'pending' as const, label: '待审核', count: filter.value === 'pending' ? totalCount.value : pending },
    { key: 'active' as const, label: '已通过', count: filter.value === 'active' ? totalCount.value : active },
  ];
});

const filteredList = computed(() => {
  if (filter.value === 'all') return list.value;
  return list.value.filter((s) => s.status === filter.value);
});

const filterLabel = computed(() => {
  if (filter.value === 'pending') return '待审核';
  if (filter.value === 'active') return '已通过';
  return '';
});

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

async function setStatus(userId: string, status: 'active' | 'rejected') {
  acting.value = `${userId}-${status === 'active' ? 'ok' : 'no'}`;
  try {
    await updateOpsStudentStatus(userId, status);
    uni.showToast({ title: status === 'active' ? '已通过' : '已拒绝', icon: 'success' });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    acting.value = '';
  }
}

function statusParam(): 'pending' | 'active' | undefined {
  if (filter.value === 'pending') return 'pending';
  if (filter.value === 'active') return 'active';
  return undefined;
}

async function reload() {
  loading.value = true;
  page.value = 1;
  try {
    const res = await fetchOpsStudentProfiles({ page: 1, pageSize: 50, status: statusParam() });
    list.value = res.list;
    totalCount.value = res.total;
    hasMore.value = res.hasMore;
  } catch (e) {
    list.value = [];
    totalCount.value = 0;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  try {
    const next = page.value + 1;
    const res = await fetchOpsStudentProfiles({ page: next, pageSize: 50, status: statusParam() });
    list.value = list.value.concat(res.list);
    page.value = next;
    totalCount.value = res.total;
    hasMore.value = res.hasMore;
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loadingMore.value = false;
  }
}

watch(filter, () => {
  void reload();
});

onShow(() => {
  if (!requireOpsSession()) return;
  void reload();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--nb-page-bg, #f5f5f5);
  padding: 24rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 12rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted, #888);
}
.mock-hint {
  margin-bottom: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  background: #fff8e8;
  border: 1rpx solid #f0dcc8;
  font-size: 22rpx;
  color: #8a5a20;
  line-height: 1.5;
}
.btn-more {
  margin: 24rpx 0;
  background: var(--nb-surface, #fff);
  color: var(--nb-primary, #c45c26);
  font-size: 26rpx;
  border: 1rpx solid #f0dcc8;
}
.filter-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}
.filter-chip {
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  background: var(--nb-surface, #fff);
  border: 1rpx solid var(--nb-border, #eee);
  color: var(--nb-text-secondary, #666);
}
.filter-chip.active {
  background: #fff3e8;
  border-color: #f0dcc8;
  color: var(--nb-primary, #c45c26);
  font-weight: 600;
}
.chip-badge {
  margin-left: 6rpx;
  font-size: 20rpx;
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
  gap: 12rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.meta {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
}
.status-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}
.st-pending {
  background: #fff8e6;
  color: #8a6d3b;
}
.st-active {
  background: #e8f5e9;
  color: #2e7d32;
}
.st-rejected {
  background: #ffebee;
  color: #c62828;
}
.verify-block {
  margin-top: 8rpx;
}
.verify-label {
  display: block;
  font-size: 22rpx;
  color: var(--nb-text-muted, #888);
  margin-bottom: 8rpx;
}
.verify-photo {
  width: 100%;
  height: 280rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  background: #f0f0f0;
}
.verify-empty {
  height: 120rpx;
  line-height: 120rpx;
  text-align: center;
  background: #fafafa;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 24rpx;
  color: #bbb;
}
.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
.btn-approve {
  flex: 1;
  background: var(--nb-primary, #c45c26);
  color: #fff;
}
.btn-reject {
  flex: 1;
  background: #fff;
  color: #c62828;
  border: 1rpx solid #f0c8c8;
}
</style>

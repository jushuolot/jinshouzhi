<template>
  <view class="page nb-page">
    <text class="title">老人机构档案</text>
    <text class="sub">维护区域、健康、居住情况 · 共 {{ totalCount }} 人</text>

    <ListSearchBar v-model="searchKeyword" placeholder="搜索姓名、手机号、机构、区域…" />

    <view class="filter-row">
      <view
        v-for="f in filters"
        :key="f.key"
        class="filter-chip"
        :class="{ active: filter === f.key }"
        @tap="filter = f.key"
      >
        {{ f.label }}
      </view>
    </view>

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!list.length" class="state">
      {{ searchKeyword ? `未找到「${searchKeyword}」相关老人` : '暂无老人档案' }}
    </view>

    <view v-for="e in list" :key="e.id" class="card" @tap="goEdit(e.id)">
      <view class="card-head">
        <ProfileAvatar
          class="card-avatar"
          :avatar-url="e.avatarUrl"
          :name="e.name"
          :editable="false"
          size="md"
        />
        <view class="info">
          <text class="name">{{ e.name || '未命名' }}</text>
          <text v-if="e.loginPhone || e.phone" class="meta phone">
            {{ e.loginPhone || e.phone }}
          </text>
          <text class="meta">{{ e.orgName || '未指定机构' }} · {{ e.district || '城市未填' }}</text>
          <text class="meta">居住 {{ e.livingSituation || '—' }} · 健康 {{ e.healthStatus || '—' }} · 行动 {{ e.mobility || '—' }}</text>
        </view>
        <text class="status-tag" :class="e.orgProfileComplete ? 'st-ok' : 'st-warn'">
          {{ e.orgProfileComplete ? '已完整' : '待补充' }}
        </text>
      </view>
      <text class="edit-hint">点击编辑机构档案 ›</text>
    </view>

    <button v-if="hasMore" class="btn-more" :loading="loadingMore" @tap="loadMore">
      加载更多（{{ list.length }} / {{ totalCount }}）
    </button>

    <OpsTabBar current="/pages/common/ops-org" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import ListSearchBar from '../../components/ListSearchBar.vue';
import OpsTabBar from '../../components/OpsTabBar.vue';
import ProfileAvatar from '../../components/ProfileAvatar.vue';
import { fetchOpsElderProfiles, type OpsElderProfile } from '../../api/platform';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';
// #ifdef H5
import { syncDevicePreviewRoute } from '../../utils/device-preview';
// #endif

const list = ref<OpsElderProfile[]>([]);
const totalCount = ref(0);
const page = ref(1);
const hasMore = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const filter = ref<'all' | 'incomplete'>('all');
const searchKeyword = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;

onLoad((q) => {
  if (String(q?.filter || '') === 'incomplete') filter.value = 'incomplete';
});

const filters = [
  { key: 'all' as const, label: '全部' },
  { key: 'incomplete' as const, label: '待补充' },
];

async function reload() {
  loading.value = true;
  page.value = 1;
  try {
    const res = await fetchOpsElderProfiles({
      page: 1,
      pageSize: 50,
      q: searchKeyword.value.trim() || undefined,
      incomplete: filter.value === 'incomplete',
    });
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
    const res = await fetchOpsElderProfiles({
      page: next,
      pageSize: 50,
      q: searchKeyword.value.trim() || undefined,
      incomplete: filter.value === 'incomplete',
    });
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

function goEdit(id: string) {
  uni.navigateTo({ url: `/pages/common/ops-elder-edit?id=${id}` });
}

watch(filter, () => {
  void reload();
});

watch(searchKeyword, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    void reload();
  }, 320);
});

onShow(() => {
  if (!requireOpsSession()) return;
  // #ifdef H5
  syncDevicePreviewRoute();
  // #endif
  void reload();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
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
  color: var(--nb-text-muted, #888);
}
.filter-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
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
  gap: 16rpx;
}
.card-avatar {
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
.meta.phone {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--nb-text-secondary, #555);
}
.status-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}
.st-ok {
  background: #e8f5e9;
  color: #2e7d32;
}
.st-warn {
  background: #fff8e6;
  color: #8a6d3b;
}
.edit-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--nb-primary, #c45c26);
}
.btn-more {
  margin: 24rpx 0;
  background: var(--nb-surface, #fff);
  color: var(--nb-primary, #c45c26);
  font-size: 26rpx;
  border: 1rpx solid #f0dcc8;
}
</style>

<template>
  <view class="page nb-page">
    <text class="title">机构派单</text>
    <text class="sub">将待接单订单指定给已审核通过的学生</text>
    <ListSearchBar v-model="searchKeyword" placeholder="搜索老人、服务、订单号…" />
    <ListCountBar :count="shown.length" :hint="countHint" />
    <view v-if="!loadingStudents && !activeStudents.length" class="hint-card">
      <text>暂无已审核学生，请先在「学生」Tab 审核通过至少一名学生后再派单。</text>
    </view>
    <view v-for="o in shown" :key="o.id" class="card">
      <text class="svc">{{ o.serviceName }}</text>
      <text v-if="o.requiresOutdoorApproval" class="outdoor-tag">外出陪同</text>
      <text class="meta">{{ o.elderName }} · ¥{{ ((o.amountCents || 0) / 100).toFixed(0) }}</text>
      <text v-if="o.scheduledAt" class="meta">预约 {{ formatTime(o.scheduledAt) }}</text>
      <button
        class="btn-sm"
        size="mini"
        :loading="dispatching === o.id"
        :disabled="!activeStudents.length"
        @tap="dispatch(o.id)"
      >
        {{ dispatchBtnLabel }}
      </button>
    </view>
    <view v-if="!loading && !shown.length" class="empty">
      {{ searchKeyword ? '无匹配订单' : '暂无待派单' }}
    </view>

    <OpsTabBar current="/pages/common/org-dispatch" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ListCountBar from '../../components/ListCountBar.vue';
import ListSearchBar from '../../components/ListSearchBar.vue';
import { matchListKeyword } from '../../utils/list-search';
import OpsTabBar from '../../components/OpsTabBar.vue';
import { dispatchOrder, listDispatchableOrders, type DispatchOrderItem } from '../../api/org';
import { fetchOpsStudentProfiles, type OpsStudentProfile } from '../../api/platform';
import { requireOpsSession } from '../../utils/ops-mode';
import { formatShortTime } from '../../utils/format-time';
import { pbErrorMessage } from '../../utils/request';

const list = ref<DispatchOrderItem[]>([]);
const activeStudents = ref<OpsStudentProfile[]>([]);
const searchKeyword = ref('');
const loading = ref(false);
const loadingStudents = ref(false);
const dispatching = ref('');

const shown = computed(() =>
  list.value.filter((o) =>
    matchListKeyword(searchKeyword.value, [o.id, o.elderName, o.serviceName, o.amountCents]),
  ),
);

const countHint = computed(() =>
  activeStudents.value.length
    ? `待派单 · 可派给 ${activeStudents.value.length} 名学生`
    : '待派单 · pending_accept',
);

const dispatchBtnLabel = computed(() => {
  if (activeStudents.value.length === 1) {
    const s = activeStudents.value[0];
    return `派给 ${s.displayName || s.nickname || '学生'}`;
  }
  return '选择学生派单';
});

function formatTime(iso: string) {
  return formatShortTime(iso);
}

async function reload() {
  loading.value = true;
  try {
    list.value = await listDispatchableOrders();
  } catch (e) {
    list.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function loadStudents() {
  loadingStudents.value = true;
  try {
    const res = await fetchOpsStudentProfiles({ status: 'active', pageSize: 100 });
    activeStudents.value = res.list;
  } catch {
    activeStudents.value = [];
  } finally {
    loadingStudents.value = false;
  }
}

onShow(() => {
  if (!requireOpsSession()) return;
  void Promise.all([reload(), loadStudents()]);
});

async function doDispatch(orderId: string, studentUserId: string) {
  dispatching.value = orderId;
  try {
    await dispatchOrder(orderId, studentUserId);
    uni.showToast({ title: '已派单', icon: 'success' });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    dispatching.value = '';
  }
}

function dispatch(id: string) {
  if (!activeStudents.value.length) {
    uni.showModal({
      title: '暂无可用学生',
      content: '请先在「学生」Tab 审核通过至少一名学生。',
      showCancel: false,
    });
    return;
  }
  if (activeStudents.value.length === 1) {
    void doDispatch(id, activeStudents.value[0].userId);
    return;
  }
  uni.showActionSheet({
    itemList: activeStudents.value.map(
      (s) => `${s.displayName || s.nickname || '学生'} · ${s.schoolName || '未填学校'}`,
    ),
    success: (res) => {
      const student = activeStudents.value[res.tapIndex];
      if (student) void doDispatch(id, student.userId);
    },
  });
}
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
  margin: 8rpx 0 20rpx;
  font-size: 24rpx;
  color: #888;
}
.hint-card {
  margin-bottom: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 24rpx;
  color: #8a6d3b;
  background: #fff8e6;
  border-radius: 12rpx;
  line-height: 1.5;
}
.card {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}
.svc {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.outdoor-tag {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8a6d3b;
  background: #fff8e6;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.meta {
  display: block;
  margin: 8rpx 0 0;
  font-size: 24rpx;
  color: #888;
}
.btn-sm {
  margin-top: 16rpx;
  background: #c45c26;
  color: #fff;
}
.btn-sm[disabled] {
  opacity: 0.45;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>

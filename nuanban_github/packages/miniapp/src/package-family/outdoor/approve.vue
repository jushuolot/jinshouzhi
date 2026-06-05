<template>
  <view class="page">
    <view v-if="loading" class="state">加载中…</view>
    <template v-else>
      <view class="hero">
        <text class="title">外出审批</text>
        <text class="sub">请确认老人外出陪同服务</text>
      </view>

      <view class="card">
        <view class="row">
          <text class="label">服务老人</text>
          <text class="value">{{ elderName }}</text>
        </view>
        <view class="row">
          <text class="label">服务项目</text>
          <text class="value">{{ serviceName }}</text>
        </view>
        <view class="row">
          <text class="label">预约时间</text>
          <text class="value">{{ scheduledAt }}</text>
        </view>
        <view class="row">
          <text class="label">服务费用</text>
          <text class="value price">¥{{ amountYuan }}</text>
        </view>
      </view>

      <view class="notice">
        <text>外出陪同需家属确认后，学生方可接单服务。拒绝后订单将取消。</text>
      </view>

      <button class="btn-ok" :loading="submitting" @tap="approve(true)">同意外出</button>
      <button class="btn-no" :disabled="submitting" @tap="approve(false)">拒绝</button>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { approveOutdoor, listPendingOutdoorApprovals } from '../../api/family';
import { useRoleStore } from '../../store/role';
import { pbErrorMessage } from '../../utils/request';

const orderId = ref('');
const elderName = ref('—');
const serviceName = ref('—');
const scheduledAt = ref('—');
const amountYuan = ref('0');
const loading = ref(true);
const submitting = ref(false);
const roleStore = useRoleStore();

function formatTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onLoad(async (q) => {
  if (q?.id) orderId.value = q.id as string;
  if (!orderId.value) {
    loading.value = false;
    return;
  }
  try {
    const uid = roleStore.user?.id;
    if (uid) {
      const list = await listPendingOutdoorApprovals(uid);
      const item = list.find((a) => a.order === orderId.value);
      const order = item?.expand?.order;
      if (order) {
        elderName.value = order.expand?.elder?.name || '老人';
        serviceName.value = order.expand?.service_item?.name || '外出陪同';
        scheduledAt.value = formatTime(order.scheduled_at);
        amountYuan.value = ((order.amount_cents || 0) / 100).toFixed(0);
      }
    }
  } catch {
    /* demo fallback */
    elderName.value = '李爷爷';
    serviceName.value = '陪同散步';
    amountYuan.value = '65';
  } finally {
    loading.value = false;
  }
});

async function approve(ok: boolean) {
  if (!orderId.value) return;
  submitting.value = true;
  try {
    await approveOutdoor(orderId.value, ok);
    uni.showToast({ title: ok ? '已同意' : '已拒绝', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.hero {
  margin-bottom: 24rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #888;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  font-size: 28rpx;
}
.label {
  color: #999;
}
.value {
  color: #333;
}
.value.price {
  color: #c45c26;
  font-weight: 600;
}
.notice {
  background: #fff8f0;
  border: 1rpx solid #f0dcc8;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 32rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}
.btn-ok {
  background: #2e7d32;
  color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}
.btn-no {
  background: #fff;
  color: #666;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
}
.state {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>

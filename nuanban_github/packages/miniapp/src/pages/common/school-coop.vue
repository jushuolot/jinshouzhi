<template>
  <view class="page">
    <text class="title">学校合作配置</text>
    <text class="sub">只读展示 · 数据来自 demo-rich-data ORG_SCHOOL_PARTNERS</text>

    <view class="table">
      <view class="row header">
        <text class="col org">机构</text>
        <text class="col schools">合作学校</text>
      </view>
      <view v-for="row in rows" :key="row.orgId" class="row">
        <text class="col org">{{ row.orgName }}</text>
        <text class="col schools">{{ row.schools.join('、') }}</text>
      </view>
    </view>

    <view class="hint">
      学生端「发现」页开启「学校合作」后，仅展示与本校有合作关系的机构老人。
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { ORG_SCHOOL_PARTNERS, orgNameById } from '../../utils/demo-rich-data';
import { requireOpsSession } from '../../utils/ops-mode';

onShow(() => {
  requireOpsSession();
});

const rows = computed(() =>
  Object.entries(ORG_SCHOOL_PARTNERS).map(([orgId, schools]) => ({
    orgId,
    orgName: orgNameById(orgId),
    schools,
  })),
);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
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
  color: #888;
}
.table {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}
.row {
  display: flex;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.row.header {
  background: #fff8f0;
  font-weight: 600;
}
.col.org {
  width: 220rpx;
  font-size: 28rpx;
}
.col.schools {
  flex: 1;
  font-size: 26rpx;
  color: #666;
}
.hint {
  margin-top: 24rpx;
  padding: 20rpx;
  font-size: 24rpx;
  color: #888;
  background: #fff;
  border-radius: 12rpx;
}
</style>

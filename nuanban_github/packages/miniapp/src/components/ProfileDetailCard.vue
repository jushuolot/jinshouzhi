<template>
  <view v-for="section in sections" :key="section.title" class="nb-card detail-card">
    <text class="nb-section-title">{{ section.title }}</text>
    <view v-if="section.tags?.length" class="tags">
      <text v-for="tag in section.tags" :key="tag" class="tag">{{ tag }}</text>
    </view>
    <view v-for="row in section.rows" :key="row.label" class="row">
      <text class="label">{{ row.label }}</text>
      <text class="value">{{ row.value }}</text>
    </view>
    <text v-if="section.note" class="note">{{ section.note }}</text>
  </view>
</template>

<script setup lang="ts">
export interface ProfileDetailRow {
  label: string;
  value: string;
}

export interface ProfileDetailSection {
  title: string;
  rows?: ProfileDetailRow[];
  tags?: string[];
  note?: string;
}

defineProps<{ sections: ProfileDetailSection[] }>();
</script>

<style scoped>
.detail-card {
  margin-bottom: 20rpx;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.tag {
  padding: 6rpx 18rpx;
  font-size: 24rpx;
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  border-radius: 24rpx;
  border: 1rpx solid var(--nb-border-dashed, #e8c4a8);
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14rpx 0;
  border-bottom: 1rpx solid var(--nb-border-light, #ebe0d6);
  gap: 24rpx;
}
.row:last-child {
  border-bottom: none;
}
.label {
  flex-shrink: 0;
  font-size: 26rpx;
  color: var(--nb-text-muted, #a89488);
  min-width: 160rpx;
}
.value {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
  color: var(--nb-text, #3d2a1f);
  line-height: 1.5;
}
.note {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--nb-text-secondary, #6b5748);
  line-height: 1.6;
}
</style>

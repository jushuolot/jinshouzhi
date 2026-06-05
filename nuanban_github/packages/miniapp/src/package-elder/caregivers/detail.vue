<template>
  <view class="page elder-mode">
    <view class="card">
      <text class="name">{{ name || '同学' }}</text>
      <text class="meta">{{ distance || '' }} · {{ school || '高校志愿者' }}</text>
    </view>
    <button class="btn-primary" @tap="goOrder">选择服务并预约</button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';

const studentUserId = ref('');
const name = ref('');
const school = ref('');
const distance = ref('');

onLoad((q) => {
  studentUserId.value = (q?.studentUserId as string) || '';
  name.value = (q?.name as string) || '';
  school.value = (q?.school as string) || '';
  distance.value = (q?.distance as string) || '';
});

function goOrder() {
  uni.navigateTo({
    url: `/package-elder/order/create?studentUserId=${studentUserId.value}`,
  });
}
</script>

<style scoped>
.card {
  margin: 32rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 12rpx;
}
.name {
  font-size: 40rpx;
  font-weight: 600;
}
.meta {
  display: block;
  margin-top: 12rpx;
  color: #666;
}
.btn-primary {
  margin: 48rpx;
  background: #c45c26;
  color: #fff;
}
</style>

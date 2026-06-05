<template>
  <view class="page">
    <text class="title">服务包（演示）</text>
    <text class="sub">零成本占位：正式版对接机构套餐与家属购买</text>
    <view v-for="pkg in packages" :key="pkg.id" class="card">
      <text class="name">{{ pkg.name }}</text>
      <text class="desc">{{ pkg.desc }}</text>
      <text class="price">¥{{ pkg.priceYuan }}/月</text>
      <button class="btn-sm" size="mini" @tap="buy(pkg.name)">模拟购买</button>
    </view>
  </view>
</template>

<script setup lang="ts">
const packages = [
  { id: 'p1', name: '基础陪护包', desc: '每月 4 次聊天陪伴', priceYuan: 199 },
  { id: 'p2', name: '康复关爱包', desc: '每月 2 次康复协助 + 2 次生活陪护', priceYuan: 399 },
  { id: 'p3', name: '全家安心包', desc: '含外出陪同审批优先通道', priceYuan: 599 },
];

function buy(name: string) {
  uni.showModal({
    title: '演示购买',
    content: `「${name}」为演示占位，不产生真实扣款。`,
    showCancel: false,
  });
}
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
.card {
  background: #fff;
  padding: 28rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}
.name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}
.desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #666;
}
.price {
  display: block;
  margin-top: 12rpx;
  font-size: 30rpx;
  color: #c45c26;
  font-weight: 600;
}
.btn-sm {
  margin-top: 16rpx;
  background: #c45c26;
  color: #fff;
}
</style>

<template>
  <view class="page">
    <text class="title">服务包购买</text>
    <text class="sub">演示购买流程 · 产生待支付订单（不产生真实扣款）</text>
    <view v-for="pkg in packages" :key="pkg.id" class="card">
      <text class="name">{{ pkg.name }}</text>
      <text class="desc">{{ pkg.desc }}</text>
      <text class="meta">每月 {{ pkg.sessionsPerMonth }} 次服务</text>
      <text class="price">¥{{ pkg.priceYuan }}/月</text>
      <button class="btn-sm" size="mini" :loading="buying === pkg.id" @tap="buy(pkg.id)">
        模拟购买
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { purchaseFamilyPackage } from '../../api/family';
import { SERVICE_PACKAGES } from '../../utils/demo-rich-data';
import { pbErrorMessage } from '../../utils/request';

const packages = SERVICE_PACKAGES;
const buying = ref('');

async function buy(packageId: string) {
  const pkg = packages.find((p) => p.id === packageId);
  if (!pkg) return;
  buying.value = packageId;
  try {
    const res = await purchaseFamilyPackage(packageId);
    uni.showModal({
      title: '购买成功（演示）',
      content: `已创建待支付订单「${res.packageName || pkg.name}」，可前往订单列表完成支付。`,
      confirmText: '查看订单',
      cancelText: '留在此页',
      success: (r) => {
        if (r.confirm) {
          uni.navigateTo({ url: '/package-family/order/list' });
        }
      },
    });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    buying.value = '';
  }
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
.meta {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #999;
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

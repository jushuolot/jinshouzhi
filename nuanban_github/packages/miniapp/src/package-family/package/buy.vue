<template>
  <view class="page nb-page">
    <view class="hero nb-hero">
      <text class="title">服务包购买</text>
      <text class="sub">{{ isDemoMock ? '选择机构套餐 · 生成待支付订单（演示，不产生真实扣款）' : '选择机构套餐 · 生成待支付订单' }}</text>
    </view>

    <view v-if="loading" class="empty nb-card">加载套餐中…</view>
    <view v-else-if="!packages.length" class="empty nb-card">暂无可用套餐</view>

    <view v-for="pkg in packages" :key="pkg.id" class="card nb-card">
      <view class="card-head">
        <text class="name">{{ pkg.name }}</text>
        <text class="price">¥{{ pkg.priceYuan }}<text class="price-unit">/月</text></text>
      </view>
      <text class="desc">{{ pkg.desc }}</text>
      <text class="meta">每月 {{ pkg.sessionsPerMonth }} 次服务 · 购买后进入待支付</text>
      <button
        class="btn-buy nb-btn-primary"
        :loading="buying === pkg.id"
        @tap="buy(pkg.id)"
      >
        {{ isDemoMock ? '模拟购买' : '购买' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { listFamilyPackages, purchaseFamilyPackage, type FamilyServicePackage } from '../../api/family';
import { guardPackageRoute } from '../../utils/nav-guard';
import { pbErrorMessage } from '../../utils/request';
import { isDemoMockEnabled } from '../../utils/demo-mock';

const isDemoMock = isDemoMockEnabled();

const packages = ref<FamilyServicePackage[]>([]);
const loading = ref(true);
const buying = ref('');

async function reload() {
  loading.value = true;
  try {
    packages.value = await listFamilyPackages();
  } catch (e) {
    packages.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  guardPackageRoute('/package-family/package/buy');
  reload();
});

async function buy(packageId: string) {
  const pkg = packages.value.find((p) => p.id === packageId);
  if (!pkg) return;
  buying.value = packageId;
  try {
    const res = await purchaseFamilyPackage(packageId);
    uni.showModal({
      title: isDemoMock ? '购买成功（演示）' : '购买成功',
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
.hero {
  margin-bottom: 24rpx;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
  line-height: 1.5;
}
.empty {
  text-align: center;
  padding: 48rpx 24rpx;
  color: var(--nb-text-muted);
  font-size: 28rpx;
}
.card {
  margin-bottom: 20rpx;
  padding: 32rpx 28rpx;
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}
.name {
  flex: 1;
  font-size: 34rpx;
  font-weight: 600;
  color: var(--nb-text);
}
.price {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--nb-primary);
}
.price-unit {
  font-size: 24rpx;
  font-weight: 500;
}
.desc {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: var(--nb-text-secondary);
  line-height: 1.5;
}
.meta {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
}
.btn-buy {
  margin-top: 24rpx;
  width: 100%;
}
</style>

<template>
  <view class="page nb-page">
    <view class="hero nb-hero secure-hero">
      <text class="shield">🛡️</text>
      <text class="hero-title">安全中心</text>
      <text class="hero-sub">便捷不等于放松安全 · 您的数据我们认真对待</text>
    </view>

    <view class="status-card nb-card">
      <text class="section-label">当前环境</text>
      <view class="status-row">
        <text class="label">产品版本</text>
        <text class="value">{{ status.appVersion }}</text>
      </view>
      <view class="status-row">
        <text class="label">发布渠道</text>
        <text class="value">{{ status.releaseChannel }}</text>
      </view>
      <view class="status-row">
        <text class="label">传输安全</text>
        <text class="value" :class="{ ok: status.isSecureContext }">{{ status.connectionLabel }}</text>
      </view>
      <view class="status-row">
        <text class="label">接口鉴权</text>
        <text class="value ok">Bearer Token + 角色头</text>
      </view>
      <view class="status-row">
        <text class="label">数据模式</text>
        <text class="value">{{ status.isDemoMock ? '浏览器 Mock' : '服务端 PocketBase' }}</text>
      </view>
      <view class="status-row">
        <text class="label">偏好加密</text>
        <text class="value ok">验收进度混淆存储</text>
      </view>
      <text class="note">{{ status.localDataNote }}</text>
    </view>

    <view class="features">
      <view v-for="f in features" :key="f.title" class="feature nb-card">
        <text class="f-icon">{{ f.icon }}</text>
        <view>
          <text class="f-title">{{ f.title }}</text>
          <text class="f-desc">{{ f.desc }}</text>
        </view>
      </view>
    </view>

    <view class="actions">
      <button class="nb-btn-primary" @tap="goAgreement">用户协议与隐私</button>
      <button v-if="status.isDemoMock" class="nb-btn-soft" @tap="clearLocal">清除本地演示数据</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getSecurityStatus } from '../../utils/security';
import { resetDemoRuntimeState, isDemoMockEnabled } from '../../utils/demo-mock';
import { requireOpsSession } from '../../utils/ops-mode';
import { removeSecure } from '../../utils/secure-storage';

onShow(() => {
  requireOpsSession();
});

const status = computed(() => getSecurityStatus());

const features = [
  {
    icon: '🔐',
    title: '传输加密',
    desc: '正式版经 HTTPS 与同源 /api 反向代理，防止窃听与篡改。',
  },
  {
    icon: '👤',
    title: '角色隔离',
    desc: '学生 / 家属 / 老人分包隔离，请求携带 X-Active-Role，服务端校验关键接口。',
  },
  {
    icon: '💳',
    title: '支付安全',
    desc: '金额以服务端订单为准；储值卡扣款二次确认；演示不产生真实扣款。',
  },
  {
    icon: '📦',
    title: '本地加密偏好',
    desc: '验收进度等偏好经客户端混淆存储，降低明文泄露风险（非令牌）。',
  },
  {
    icon: '🆘',
    title: '敏感操作确认',
    desc: 'SOS、外出审批、代付与确认完成均需显式确认，防误触。',
  },
  {
    icon: '🔄',
    title: '会话保护',
    desc: '401 自动登出；退出登录清除本地令牌与角色缓存。',
  },
];

function goAgreement() {
  uni.navigateTo({ url: '/pages/common/agreement' });
}

function clearLocal() {
  if (!isDemoMockEnabled()) return;
  uni.showModal({
    title: '清除本地数据',
    content: '将清除订单、储值卡、验收进度等演示状态，是否继续？',
    success: (res) => {
      if (res.confirm) {
        resetDemoRuntimeState();
        removeSecure('nuanban_scenario_v1');
        uni.showToast({ title: '已清除', icon: 'success' });
      }
    },
  });
}
</script>

<style scoped>
.secure-hero {
  text-align: center;
  padding: 40rpx 28rpx;
}
.shield {
  font-size: 64rpx;
}
.hero-title {
  display: block;
  margin-top: 12rpx;
  font-size: 38rpx;
  font-weight: 700;
}
.hero-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary);
  line-height: 1.5;
}
.section-label {
  display: block;
  font-size: 24rpx;
  color: var(--nb-text-muted);
  margin-bottom: 16rpx;
}
.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid var(--nb-border-light);
}
.status-row:last-of-type {
  border-bottom: none;
}
.label {
  font-size: 28rpx;
  color: var(--nb-text-secondary);
}
.value {
  font-size: 28rpx;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
}
.value.ok {
  color: #2e7d32;
}
.note {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted);
  line-height: 1.5;
}
.feature {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  margin-bottom: 12rpx;
}
.f-icon {
  font-size: 36rpx;
}
.f-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}
.f-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--nb-text-secondary);
  line-height: 1.5;
}
.actions {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.actions button {
  width: 100%;
}
</style>

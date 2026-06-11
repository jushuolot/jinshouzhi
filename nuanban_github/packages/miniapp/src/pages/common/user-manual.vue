<template>
  <view class="page nb-page">
    <text class="title">用户手册</text>
    <text class="sub">使用暖伴勤工前，请仔细阅读以下内容</text>

    <scroll-view class="scroll" scroll-y>
      <view class="card">
        <text class="h">一、产品定位</text>
        <text class="p">暖伴勤工连接附近中老年与在校大学生，提供有偿陪护撮合服务。平台记录订单、结算与 SOS 流程，三端可追溯。</text>

        <text class="h">二、三种使用路径</text>
        <text class="p">① 机构派单：养老院向平台下单，学生接单服务。</text>
        <text class="p">② 老人找同学：老人按距离浏览大学生并预约陪护。</text>
        <text class="p">③ 同学找需求：学生看待接单池或附近老人需求。</text>

        <text class="h">三、角色与职责</text>
        <text class="p">老人：发布需求、确认服务、一键求助。</text>
        <text class="p">家属：代付订单、外出审批、绑定老人、SOS 确认。</text>
        <text class="p">学生：接单、签到、完成服务、查看收入与提现。</text>

        <text class="h">四、付费与收款</text>
        <text class="p">家属/老人通过储值卡或微信支付（演示）完成订单付款；学生侧配置扫呗收款账户后，方可接收结算与提现（正式版对接）。</text>

        <text class="h">五、安全与隐私</text>
        <text class="p">测试版使用浏览器 Mock 数据，不产生真实扣款。请勿在演示环境输入真实银行卡号。SOS 与外出审批为模拟流程，不构成真实紧急救援承诺。</text>

        <text class="h">六、首次使用流程</text>
        <text class="p">1. 观看动画演示，可先预览三端首页。</text>
        <text class="p">2. 阅读本手册并确认后，手机号或微信登录。</text>
        <text class="p">3. 完善个人资料，含扫呗付款/收款账户配置。</text>
        <text class="p">4. 资料完整后方可接单、下单与支付。</text>
      </view>
    </scroll-view>

    <label class="check-row" @tap="toggleCheck">
      <checkbox :checked="accepted" color="#c45c26" />
      <text class="check-text">我已阅读并理解《用户手册》</text>
    </label>

    <button class="btn" :disabled="!accepted" :class="{ disabled: !accepted }" @tap="confirm">
      确认并继续
    </button>
    <button class="btn-outline" @tap="goAgreement">查看用户协议</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { markUserManualAccepted } from '../../utils/user-manual';

const accepted = ref(false);
const nextTarget = ref('login');

onLoad((query) => {
  nextTarget.value = query?.next === 'login' ? 'login' : 'login';
});

function toggleCheck() {
  accepted.value = !accepted.value;
}

function confirm() {
  if (!accepted.value) {
    uni.showToast({ title: '请先勾选确认', icon: 'none' });
    return;
  }
  markUserManualAccepted();
  if (nextTarget.value === 'login') {
    uni.redirectTo({ url: '/pages/common/login' });
    return;
  }
  uni.navigateBack();
}

function goAgreement() {
  uni.navigateTo({ url: '/pages/common/agreement' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--nb-page-bg, #f5f5f5);
  padding: 24rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--nb-text, #333);
}
.sub {
  display: block;
  margin-top: 8rpx;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted, #999);
}
.scroll {
  flex: 1;
  max-height: 52vh;
  margin-bottom: 20rpx;
}
.card {
  background: var(--nb-surface, #fff);
  border-radius: var(--nb-radius-md, 16rpx);
  padding: 28rpx 24rpx;
}
.h {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--nb-primary, #c45c26);
}
.h:first-child {
  margin-top: 0;
}
.p {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: var(--nb-text-secondary, #555);
  line-height: 1.65;
}
.check-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.check-text {
  font-size: 26rpx;
  color: var(--nb-text, #333);
}
.btn {
  background: var(--nb-primary-gradient, linear-gradient(135deg, #c45c26, #e88b4a));
  color: #fff;
  border-radius: var(--nb-radius-pill, 48rpx);
  font-size: 30rpx;
}
.btn.disabled {
  opacity: 0.45;
}
.btn-outline {
  margin-top: 16rpx;
  background: #fff;
  color: var(--nb-text-secondary, #666);
  border: 2rpx solid var(--nb-border, #ddd);
  border-radius: var(--nb-radius-pill, 48rpx);
}
.btn-outline::after {
  border: none;
}
</style>

<template>
  <view class="page nb-page">
    <text class="title">注册前须知</text>
    <text class="sub">注册登录前，请阅读并同意以下协议（与常见应用注册流程一致）</text>

    <scroll-view class="scroll" scroll-y>
      <view class="card">
        <text class="doc-title">《用户服务协议》摘要</text>
        <text class="p">欢迎使用暖伴勤工。本协议是您与平台之间关于使用陪护撮合服务的法律协议。</text>
        <text class="h">1. 服务内容</text>
        <text class="p">平台为老人、家属、高校学生及养老机构提供陪护需求发布、撮合、订单管理、结算与客服支持。具体服务以页面展示及订单约定为准。</text>
        <text class="h">2. 账号注册</text>
        <text class="p">您应使用真实手机号或经授权的微信账号注册。一人一号，不得冒用他人身份。学生用户须为在校大学生或经平台审核通过。</text>
        <text class="h">3. 用户行为规范</text>
        <text class="p">不得发布违法、虚假、骚扰性信息；不得线下绕过平台交易；不得利用系统漏洞。违规账号可能被限制或注销。</text>
        <text class="h">4. 订单与费用</text>
        <text class="p">服务价格以订单页面明示为准。家属/老人完成支付后订单进入履约；学生完成服务后按平台规则结算。演示环境不产生真实扣款。</text>
        <text class="h">5. 免责声明</text>
        <text class="p">平台为信息撮合方。SOS、外出陪同等为辅助功能，不构成紧急救援或医疗承诺。因不可抗力或第三方原因导致的损失，平台责任以法律规定为限。</text>
        <text class="link" @tap="goAgreement">查看完整《用户服务协议》›</text>

        <text class="doc-title">《隐私政策》摘要</text>
        <text class="p">我们重视您的个人信息保护，遵循合法、正当、必要原则处理信息。</text>
        <text class="h">1. 收集范围</text>
        <text class="p">手机号、微信标识、角色资料、订单与服务记录、支付/收款配置、设备与日志信息；位置信息仅在您授权后用于距离展示。</text>
        <text class="h">2. 使用与共享</text>
        <text class="p">用于注册登录、撮合履约、结算、安全风控与客服。撮合必要信息会在服务相关方之间展示；支付等由合规第三方处理。</text>
        <text class="h">3. 您的权利</text>
        <text class="p">您可查询、更正、删除个人信息，撤回授权或申请注销账号。</text>
        <text class="h">4. 游客模式</text>
        <text class="p">未注册时可选择老人/家属/学生演示数据浏览与模拟操作，此类数据不会持久保存。</text>
        <text class="link" @tap="goPrivacy">查看完整《隐私政策》›</text>
      </view>
    </scroll-view>

    <label class="check-row" @tap="toggleCheck">
      <checkbox :checked="accepted" color="#c45c26" />
      <text class="check-text">我已阅读并同意《用户服务协议》和《隐私政策》</text>
    </label>

    <button class="btn" :disabled="!accepted" :class="{ disabled: !accepted }" @tap="confirm">
      同意并继续注册/登录
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { markRegistrationConsent } from '../../utils/user-manual';

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
    uni.showToast({ title: '请先勾选同意协议', icon: 'none' });
    return;
  }
  markRegistrationConsent();
  const from = nextTarget.value === 'login' ? '' : '';
  uni.redirectTo({ url: `/pages/common/login${from ? `?from=${from}` : ''}` });
}

function goAgreement() {
  uni.navigateTo({ url: '/pages/common/agreement' });
}

function goPrivacy() {
  uni.navigateTo({ url: '/pages/common/privacy-policy' });
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
  margin: 8rpx 0 20rpx;
  font-size: 24rpx;
  color: var(--nb-text-muted, #999);
  line-height: 1.5;
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
.doc-title {
  display: block;
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--nb-text);
}
.doc-title + .p {
  margin-top: 12rpx;
}
.h {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--nb-primary, #c45c26);
}
.p {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--nb-text-secondary, #555);
  line-height: 1.65;
}
.link {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: var(--nb-primary, #c45c26);
}
.check-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.check-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--nb-text, #333);
  line-height: 1.5;
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
</style>

<template>
  <view class="page">
    <text class="title">用户协议与隐私说明</text>
    <view class="card">
      <text class="p">欢迎使用暖伴勤工。本演示版用于产品体验，不涉及真实资金结算。</text>
      <text class="h">一、服务说明</text>
      <text class="p">平台连接老人、家属、高校学生与养老机构，提供陪护、康复协助等预约服务。</text>
      <text class="h">二、演示模式</text>
      <text class="p">公网演示使用浏览器内模拟数据，无需注册微信支付；本地联调使用 PocketBase。</text>
      <text class="h">三、隐私</text>
      <text class="p">演示环境请勿输入真实身份证号、银行卡号。正式上线前将另行公示隐私政策。</text>
      <text class="h">四、免责</text>
      <text class="p">SOS、外出审批等功能在演示中为模拟流程，不构成真实紧急救援承诺。</text>
    </view>
    <button class="btn" @tap="back">我已阅读</button>
  </view>
</template>

<script setup lang="ts">
function back() {
  uni.navigateBack();
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
  margin-bottom: 24rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
}
.h {
  display: block;
  margin-top: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #c45c26;
}
.p {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #555;
  line-height: 1.6;
}
.btn {
  margin-top: 32rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
</style>

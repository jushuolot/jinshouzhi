<template>
  <view class="page nb-page">
    <text class="title">用户协议与隐私说明</text>
    <view class="card nb-card">
      <text class="p">欢迎使用暖伴勤工。我们致力于便捷、安全、清晰的养老陪护撮合体验。</text>
      <text class="h">一、服务说明</text>
      <text class="p">平台连接老人、家属、高校学生与养老机构，提供陪护、康复协助等明码标价服务。</text>
      <text class="h">二、数据与安全</text>
      <text class="p">正式版经 HTTPS 加密传输；接口使用 Bearer 令牌与角色头鉴权。请勿在演示环境输入真实身份证号、银行卡号。</text>
      <text class="h">三、演示模式</text>
      <text class="p">测试版使用浏览器内 Mock 数据，不产生真实扣款；本地验收进度经混淆存储。</text>
      <text class="h">四、隐私</text>
      <text class="p">我们仅收集提供服务所必需的信息。详情见「安全中心」。</text>
      <text class="h">五、免责</text>
      <text class="p">SOS、外出审批等在演示中为模拟流程，不构成真实紧急救援承诺。</text>
    </view>
    <button class="btn nb-btn-primary" @tap="goSecurity">打开安全中心</button>
    <button class="btn-outline" @tap="back">我已阅读</button>
  </view>
</template>

<script setup lang="ts">
function goSecurity() {
  uni.navigateTo({ url: '/pages/common/security' });
}

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
  margin-top: 24rpx;
  width: 100%;
}
.btn-outline {
  margin-top: 16rpx;
  background: #fff;
  color: #666;
  border: 2rpx solid #ddd;
  border-radius: 48rpx;
  height: 88rpx;
  line-height: 88rpx;
}
.btn-outline::after {
  border: none;
}
</style>

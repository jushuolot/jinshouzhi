<template>
  <view class="page nb-page">
    <text class="title">用户服务协议</text>
    <text class="updated">更新日期：2026年6月5日</text>

    <scroll-view class="scroll" scroll-y>
      <view class="card nb-card">
        <text class="p">欢迎使用暖伴勤工。请您仔细阅读本协议。点击同意或实际使用服务，即表示您已阅读并同意受本协议约束。</text>

        <text class="h">第一条 定义</text>
        <text class="p">1.1 「平台」指暖伴勤工运营方提供的移动应用、网站及相关服务。</text>
        <text class="p">1.2 「用户」包括老人用户、家属用户、学生用户及合作机构授权人员。</text>
        <text class="p">1.3 「服务」指平台提供的陪护需求发布、信息撮合、订单管理、支付结算、客服支持等。</text>

        <text class="h">第二条 账号注册与使用</text>
        <text class="p">2.1 您应具备完全民事行为能力；学生用户应为在校大学生或经平台审核。</text>
        <text class="p">2.2 您应提供真实、准确、完整的注册信息，并及时更新。</text>
        <text class="p">2.3 账号仅限本人使用，请妥善保管登录凭证。因您保管不善导致的损失由您自行承担。</text>

        <text class="h">第三条 服务规则</text>
        <text class="p">3.1 平台展示的服务价格、时长、范围以订单页面为准。</text>
        <text class="p">3.2 老人/家属下单并支付后，学生可接单履约；各方应诚信完成服务与确认。</text>
        <text class="p">3.3 禁止发布违法信息、虚假订单、线下绕开平台交易及任何损害平台或其他用户的行为。</text>

        <text class="h">第四条 费用与支付</text>
        <text class="p">4.1 家属/老人可通过储值卡、微信支付或平台接入的第三方支付（如扫呗）完成付款。</text>
        <text class="p">4.2 学生收款账户须经平台认证后方可提现；结算规则以平台公示为准。</text>
        <text class="p">4.3 测试/演示环境不产生真实资金往来，仅用于功能体验。</text>

        <text class="h">第五条 知识产权</text>
        <text class="p">平台内的商标、界面、文案、代码等知识产权归平台或权利人所有。未经授权不得复制或用于商业用途。</text>

        <text class="h">第六条 隐私保护</text>
        <text class="p">我们如何处理个人信息，详见《隐私政策》。使用服务即表示您亦已阅读该政策。</text>

        <text class="h">第七条 免责与责任限制</text>
        <text class="p">7.1 平台作为撮合方，不对用户线下行为承担担保责任。</text>
        <text class="p">7.2 SOS、外出审批等功能为辅助工具，不构成紧急救援、医疗或监护义务。</text>
        <text class="p">7.3 因网络、设备、不可抗力或第三方原因导致的服务中断，平台将尽力修复但不承担超出法律规定的责任。</text>

        <text class="h">第八条 协议变更与终止</text>
        <text class="p">平台有权修订本协议，并通过应用内公告等方式通知。您可停止使用服务；继续使用视为接受修订。平台可在用户违约时暂停或终止服务。</text>

        <text class="h">第九条 适用法律与争议解决</text>
        <text class="p">本协议适用中华人民共和国法律。争议应友好协商；协商不成的，提交平台所在地有管辖权的人民法院诉讼解决。</text>

        <text class="h">第十条 联系我们</text>
        <text class="p">客服邮箱：support@nuanban.cc（示例）</text>
      </view>
    </scroll-view>

    <button class="btn-outline" @tap="goPrivacy">查看《隐私政策》</button>
    <button class="btn-outline" @tap="back">返回</button>
  </view>
</template>

<script setup lang="ts">
function goPrivacy() {
  uni.navigateTo({ url: '/pages/common/privacy-policy' });
}

function back() {
  uni.navigateBack();
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.updated {
  display: block;
  margin: 8rpx 0 16rpx;
  font-size: 22rpx;
  color: #999;
}
.scroll {
  flex: 1;
  max-height: 72vh;
}
.card {
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
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #555;
  line-height: 1.6;
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

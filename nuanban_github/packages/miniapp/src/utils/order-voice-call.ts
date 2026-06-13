import { initiateOrderCall } from '../api/order-call';
import { pbErrorMessage } from '../utils/request';

function dialMaskedNumber(num: string) {
  uni.makePhoneCall({
    phoneNumber: num,
    fail: () => {
      uni.setClipboardData({
        data: num,
        success: () => {
          uni.showToast({ title: '号码已复制，请手动拨打', icon: 'none', duration: 2500 });
        },
      });
    },
  });
}

/** 发起订单 WebRTC / 隐私号语音通话 */
export async function startOrderVoiceCall(orderId: string) {
  if (!orderId) return;
  try {
    const info = await initiateOrderCall(orderId);
    if (!info.callOpen) {
      uni.showToast({ title: info.hint || '当前不可语音通话', icon: 'none' });
      return;
    }

    // #ifdef H5
    if (info.mode === 'webrtc') {
      uni.navigateTo({
        url: `/pages/common/order-voice-call?orderId=${encodeURIComponent(orderId)}&initiator=1`,
      });
      return;
    }
    // #endif

    // #ifdef MP-WEIXIN
    // 微信小程序 fork：生产应接入 wx.joinVoIPChat / wx.updateVoIPChatMuteConfig
    uni.showToast({
      title: '小程序请使用微信 VoIP（待接入）',
      icon: 'none',
      duration: 3000,
    });
    return;
    // #endif

    const display = info.maskedNumberDisplay || info.maskedNumber;
    uni.showModal({
      title: '语音通话',
      content: `将拨打订单隐私号联系「${info.peerAlias}」。\n号码：${display}\n\n${info.hint}`,
      confirmText: '拨打',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return;
        dialMaskedNumber(info.maskedNumber);
      },
    });
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}

/** 被叫方进入 WebRTC 通话页（H5） */
export function joinOrderVoiceCall(orderId: string) {
  if (!orderId) return;
  // #ifdef H5
  uni.navigateTo({
    url: `/pages/common/order-voice-call?orderId=${encodeURIComponent(orderId)}&initiator=0`,
  });
  // #endif
  // #ifndef H5
  uni.showToast({ title: '当前平台暂不支持实时语音', icon: 'none' });
  // #endif
}

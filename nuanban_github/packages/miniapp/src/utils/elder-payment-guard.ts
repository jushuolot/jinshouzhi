import { fetchPaymentAccount } from '../api/payment-account';
import { isDemoMockEnabled } from './demo-mock';

/** 老人端：付款/充值前检查扫呗账户是否已配置 */
export async function ensureElderPaymentReady(actionLabel: string): Promise<boolean> {
  const isDemoMock = isDemoMockEnabled();
  try {
    const acc = await fetchPaymentAccount('elder');
    if (acc.configured) return true;
  } catch {
    /* treat as not configured */
  }
  return new Promise((resolve) => {
    uni.showModal({
      title: '请先配置付款方式',
      content: `${actionLabel}前需绑定扫呗付款账户${isDemoMock ? '（演示环境可填任意数字）' : ''}。现在去配置？`,
      confirmText: '去配置',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/package-elder/profile/edit?focus=payment' });
        }
        resolve(false);
      },
      fail: () => resolve(false),
    });
  });
}

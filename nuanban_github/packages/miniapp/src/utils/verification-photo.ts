import { API_BASE } from './request';
import { useRoleStore } from '../store/role';
import { isDemoMockEnabled } from './demo-mock';
import { setMockVerificationPhotoUrl } from './mock-verification-storage';

/** 学生实名核验照：仅允许相机拍摄上传 */
export async function captureAndUploadVerificationPhoto(): Promise<string> {
  const role = useRoleStore();
  const userId = role.user?.id;
  const token = role.token;
  if (!userId || !token) throw new Error('请先登录');

  const pick = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: resolve,
      fail: reject,
    });
  });
  const filePath = pick.tempFilePaths?.[0];
  if (!filePath) throw new Error('未拍摄照片');

  if (isDemoMockEnabled()) {
    setMockVerificationPhotoUrl(userId, filePath);
    return filePath;
  }

  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE}/nuanban/student/verification-photo`,
      filePath,
      name: 'photo',
      header: {
        Authorization: `Bearer ${token}`,
        ...(role.activeRole ? { 'X-Active-Role': role.activeRole } : {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data as string) as { verificationPhotoUrl?: string };
            resolve(data.verificationPhotoUrl || filePath);
          } catch (err) {
            reject(err);
          }
          return;
        }
        try {
          reject(JSON.parse(res.data as string));
        } catch {
          reject(new Error(`上传失败 HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => reject(err),
    });
  });
}

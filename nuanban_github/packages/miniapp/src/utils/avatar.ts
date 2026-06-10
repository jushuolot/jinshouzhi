import { API_BASE } from './request';
import { useRoleStore } from '../store/role';
import { isDemoMockEnabled } from './demo-mock';
import { getMockAvatarUrl, setMockAvatarUrl } from './mock-avatar-storage';

/** 构建 PocketBase users 头像 URL */
export function buildUserAvatarUrl(userId: string, filename: string, token?: string): string {
  if (!filename) return '';
  const base = API_BASE.replace(/\/api\/?$/, '');
  const q = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${base}/api/files/users/${userId}/${filename}${q}`;
}

/** 选择相册/拍照并上传头像，返回可展示的 URL */
export async function chooseAndUploadAvatar(): Promise<string> {
  const role = useRoleStore();
  const userId = role.user?.id;
  const token = role.token;
  if (!userId || !token) throw new Error('请先登录');

  const pick = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: resolve,
      fail: reject,
    });
  });
  const filePath = pick.tempFilePaths?.[0];
  if (!filePath) throw new Error('未选择图片');

  if (isDemoMockEnabled()) {
    const url = filePath.startsWith('data:') ? filePath : filePath;
    setMockAvatarUrl(userId, url);
    role.setUserAvatar(url);
    return url;
  }

  const url = await new Promise<string>((resolve, reject) => {
    // uni.uploadFile 在 H5/小程序侧实际走 POST；PB 更新记录需 PATCH，故走自定义路由
    uni.uploadFile({
      url: `${API_BASE}/nuanban/auth/avatar`,
      filePath,
      name: 'avatar',
      header: {
        Authorization: `Bearer ${token}`,
        ...(role.activeRole ? { 'X-Active-Role': role.activeRole } : {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data as string) as { avatarUrl?: string; avatar?: string };
            const avatarUrl =
              data.avatarUrl || buildUserAvatarUrl(userId, data.avatar || '', token);
            role.setUserAvatar(avatarUrl);
            resolve(avatarUrl);
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
  return url;
}

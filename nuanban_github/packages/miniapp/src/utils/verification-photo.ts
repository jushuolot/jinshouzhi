import { pickCameraImage, type CameraPickResult } from './camera-picker';
import { saveVerificationPhotoToDevDisk } from './dev-verification-store';
import { API_BASE } from './request';
import { useRoleStore } from '../store/role';
import { isDemoMockEnabled } from './demo-mock';
import { setMockVerificationPhotoUrl } from './mock-verification-storage';

async function uploadVerificationBlob(
  pick: CameraPickResult,
  token: string,
  activeRole?: string,
): Promise<string> {
  if (!pick.file) {
    return uploadVerificationPath(pick.filePath, token, activeRole);
  }
  const form = new FormData();
  form.append('photo', pick.file, pick.file.name || 'verification.jpg');
  const res = await fetch(`${API_BASE}/nuanban/student/verification-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(activeRole ? { 'X-Active-Role': activeRole } : {}),
    },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    try {
      throw JSON.parse(text);
    } catch {
      throw new Error(`上传失败 HTTP ${res.status}`);
    }
  }
  try {
    const data = JSON.parse(text) as { verificationPhotoUrl?: string };
    return data.verificationPhotoUrl || pick.previewUrl;
  } catch {
    return pick.previewUrl;
  }
}

function uploadVerificationPath(
  filePath: string,
  token: string,
  activeRole?: string,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE}/nuanban/student/verification-photo`,
      filePath,
      name: 'photo',
      header: {
        Authorization: `Bearer ${token}`,
        ...(activeRole ? { 'X-Active-Role': activeRole } : {}),
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

/** 学生实名核验照：仅允许相机拍摄上传 */
export async function captureVerificationPreview() {
  return pickCameraImage();
}

export async function uploadVerificationPick(pick: CameraPickResult): Promise<string> {
  const role = useRoleStore();
  const userId = role.user?.id;
  const token = role.token;
  if (!userId || !token) throw new Error('请先登录');

  const diskUrl = await saveVerificationPhotoToDevDisk(userId, pick.previewUrl);
  const storedUrl = diskUrl || pick.previewUrl;

  if (isDemoMockEnabled()) {
    setMockVerificationPhotoUrl(userId, storedUrl);
    return storedUrl;
  }

  const uploaded = await uploadVerificationBlob(pick, token, role.activeRole ?? 'student');
  if (diskUrl) return diskUrl;
  return uploaded;
}

/** 学生实名核验照：拍摄并立即上传（需已绑定学生身份） */
export async function captureAndUploadVerificationPhoto(): Promise<string> {
  const pick = await captureVerificationPreview();
  return uploadVerificationPick(pick);
}

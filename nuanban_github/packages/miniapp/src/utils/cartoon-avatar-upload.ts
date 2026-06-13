import { pickCameraImage, type CameraPickResult } from './camera-picker';
import { API_BASE } from './request';
import { useRoleStore } from '../store/role';
import { isDemoMockEnabled } from './demo-mock';

async function uploadCartoonBlob(
  pick: CameraPickResult,
  token: string,
  activeRole?: string,
): Promise<string> {
  if (!pick.file) {
    return uploadCartoonPath(pick.filePath, token, activeRole);
  }
  const form = new FormData();
  form.append('avatar', pick.file, pick.file.name || 'cartoon.jpg');
  const res = await fetch(`${API_BASE}/nuanban/student/cartoon-avatar`, {
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
    const data = JSON.parse(text) as { customCartoonAvatarUrl?: string };
    return data.customCartoonAvatarUrl || pick.previewUrl;
  } catch {
    return pick.previewUrl;
  }
}

function uploadCartoonPath(
  filePath: string,
  token: string,
  activeRole?: string,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE}/nuanban/student/cartoon-avatar`,
      filePath,
      name: 'avatar',
      header: {
        Authorization: `Bearer ${token}`,
        ...(activeRole ? { 'X-Active-Role': activeRole } : {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data as string) as { customCartoonAvatarUrl?: string };
            resolve(data.customCartoonAvatarUrl || filePath);
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

export async function pickCustomCartoonAvatar(): Promise<CameraPickResult> {
  return pickCameraImage();
}

export async function uploadCustomCartoonPick(pick: CameraPickResult): Promise<string> {
  const role = useRoleStore();
  const token = role.token;
  if (!token) throw new Error('请先登录');

  if (isDemoMockEnabled()) {
    return pick.previewUrl;
  }

  return uploadCartoonBlob(pick, token, role.activeRole ?? 'student');
}

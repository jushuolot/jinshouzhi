import { canUseFaceCapture, requestFaceCapture } from './face-capture';

/** H5 核验照：优先人脸取景框；小程序回退系统相机 */

export interface CameraPickResult {
  /** uni.uploadFile 或预览用路径 */
  filePath: string;
  /** 持久化/预览优先（data URL） */
  previewUrl: string;
  /** H5 原生 File，供 FormData 上传 */
  file?: File;
}

function isH5(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isIOSDevice(): boolean {
  if (!isH5()) return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('读取照片失败'));
    reader.readAsDataURL(file);
  });
}

/** iOS H5：系统相机（前置 capture=user） */
function pickCameraViaNativeInput(
  capture: 'user' | 'environment' = 'user',
): Promise<CameraPickResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', capture);
    input.style.cssText = 'position:fixed;left:-9999px;opacity:0';
    document.body.appendChild(input);

    const cleanup = () => {
      input.remove();
    };

    const onPick = async () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        reject(new Error('cancel'));
        return;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        resolve({
          filePath: dataUrl,
          previewUrl: dataUrl,
          file,
        });
      } catch (err) {
        reject(err);
      }
    };

    input.addEventListener('change', () => void onPick(), { once: true });
    input.addEventListener('cancel', () => {
      cleanup();
      reject(new Error('cancel'));
    });

    input.click();
  });
}

export async function pickCameraImage(): Promise<CameraPickResult> {
  if (isH5()) {
    if (isIOSDevice()) {
      return pickCameraViaNativeInput('user');
    }
    if (canUseFaceCapture()) {
      try {
        return await requestFaceCapture();
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg && !/cancel|取消/i.test(msg)) {
          return pickCameraViaNativeInput('user');
        }
        throw err;
      }
    }
    return pickCameraViaNativeInput('user');
  }

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
  return { filePath, previewUrl: filePath };
}

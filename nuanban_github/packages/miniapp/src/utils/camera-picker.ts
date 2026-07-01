import { isMobileH5Browser } from './h5-dom';

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

export async function fileToPickResult(file: File): Promise<CameraPickResult> {
  const dataUrl = await fileToDataUrl(file);
  return {
    filePath: dataUrl,
    previewUrl: dataUrl,
    file,
  };
}

function isMobileH5(): boolean {
  return isMobileH5Browser();
}

/** H5 选图：桌面允许相册/文件；移动端可走 capture；局域网 HTTP 走系统相册/相机选择 */
function pickCameraViaNativeInput(
  capture?: 'user' | 'environment',
  allowAlbum = false,
): Promise<CameraPickResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture && isMobileH5() && !allowAlbum) {
      input.setAttribute('capture', capture);
    }
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
    // 桌面浏览器：直接文件选择（本地联调、无摄像头）
    if (!isMobileH5()) {
      return pickCameraViaNativeInput();
    }
    // 手机内置浏览器（微信/鸿蒙等）getUserMedia 常不可用，统一走相册/相机文件选择
    return pickCameraViaNativeInput(undefined, true);
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

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

function nativeFileInputPick(capture?: string): Promise<CameraPickResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) {
      input.setAttribute('capture', capture);
    }
    input.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0';
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
        resolve(await fileToPickResult(file));
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

function mobileCameraCaptureAttr(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/HarmonyOS|OpenHarmony|Android/i.test(ua)) return 'environment';
  if (isIOSDevice()) return 'user';
  return 'environment';
}

/** H5 相册选图（无 capture） */
export function pickImageFromAlbum(): Promise<CameraPickResult> {
  if (!isH5()) {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (pick) => {
          const filePath = pick.tempFilePaths?.[0];
          if (!filePath) {
            reject(new Error('未选择照片'));
            return;
          }
          resolve({ filePath, previewUrl: filePath });
        },
        fail: reject,
      });
    });
  }
  return nativeFileInputPick();
}

/** H5 直接调起相机（动态 input + capture，兼容鸿蒙内置浏览器） */
export function pickImageFromCamera(): Promise<CameraPickResult> {
  if (!isH5()) {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera'],
        success: (pick) => {
          const filePath = pick.tempFilePaths?.[0];
          if (!filePath) {
            reject(new Error('未拍摄照片'));
            return;
          }
          resolve({ filePath, previewUrl: filePath });
        },
        fail: reject,
      });
    });
  }
  return nativeFileInputPick(mobileCameraCaptureAttr());
}

export async function pickCameraImage(): Promise<CameraPickResult> {
  if (isH5()) {
    if (!isMobileH5()) {
      return nativeFileInputPick();
    }
    return pickImageFromCamera();
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

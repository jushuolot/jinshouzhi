import { ref } from 'vue';
import type { CameraPickResult } from './camera-picker';

/** 人脸框在取景器中的比例（居中椭圆外接矩形） */
export const FACE_FRAME = {
  cx: 0.5,
  cy: 0.4,
  w: 0.72,
  h: 0.92,
};

type Pending = {
  resolve: (r: CameraPickResult) => void;
  reject: (e: Error) => void;
};

let pending: Pending | null = null;

export const faceCaptureVisible = ref(false);

function isH5(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function canUseFaceCapture(): boolean {
  return (
    isH5()
    && typeof window !== 'undefined'
    && window.isSecureContext === true
    && !!navigator.mediaDevices?.getUserMedia
  );
}

export function requestFaceCapture(): Promise<CameraPickResult> {
  if (!canUseFaceCapture()) {
    return Promise.reject(new Error('当前环境不支持取景拍摄'));
  }
  return new Promise((resolve, reject) => {
    pending = { resolve, reject };
    faceCaptureVisible.value = true;
  });
}

export function finishFaceCapture(result: CameraPickResult) {
  pending?.resolve(result);
  pending = null;
  faceCaptureVisible.value = false;
}

export function cancelFaceCapture(reason = 'cancel') {
  pending?.reject(new Error(reason));
  pending = null;
  faceCaptureVisible.value = false;
}

/** object-fit:cover 下，将容器坐标映射到 video 像素坐标 */
export function mapContainerRectToVideo(
  video: HTMLVideoElement,
  containerW: number,
  containerH: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const scale = Math.max(containerW / vw, containerH / vh);
  const displayW = vw * scale;
  const displayH = vh * scale;
  const offsetX = (displayW - containerW) / 2;
  const offsetY = (displayH - containerH) / 2;

  let sx = (rect.x + offsetX) / scale;
  let sy = (rect.y + offsetY) / scale;
  let sw = rect.w / scale;
  let sh = rect.h / scale;

  sx = Math.max(0, Math.min(sx, vw - 1));
  sy = Math.max(0, Math.min(sy, vh - 1));
  sw = Math.max(1, Math.min(sw, vw - sx));
  sh = Math.max(1, Math.min(sh, vh - sy));

  return { sx, sy, sw, sh };
}

export function validateCapturedImage(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const { width, height } = canvas;
  if (width < 80 || height < 80) return false;

  const sample = ctx.getImageData(0, 0, width, height).data;
  let sum = 0;
  let sumSq = 0;
  const pixels = sample.length / 4;
  for (let i = 0; i < sample.length; i += 16) {
    const g = 0.299 * sample[i] + 0.587 * sample[i + 1] + 0.114 * sample[i + 2];
    sum += g;
    sumSq += g * g;
  }
  const n = pixels / 4;
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  if (mean < 28) return false;
  if (variance < 180) return false;
  return true;
}

export function canvasToPickResult(canvas: HTMLCanvasElement): Promise<CameraPickResult> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('生成照片失败'));
          return;
        }
        const file = new File([blob], 'verification.jpg', { type: 'image/jpeg' });
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || '');
          resolve({ filePath: dataUrl, previewUrl: dataUrl, file });
        };
        reader.onerror = () => reject(new Error('读取照片失败'));
        reader.readAsDataURL(file);
      },
      'image/jpeg',
      0.88,
    );
  });
}

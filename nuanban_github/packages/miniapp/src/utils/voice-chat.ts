/** 订单密聊 · 录音与播放（H5 / 小程序） */

const MAX_VOICE_SEC = 60;

export interface VoiceRecording {
  tempFilePath: string;
  durationSec: number;
  mimeType: string;
}

let recorder: UniApp.RecorderManager | null | undefined;
let activePlayer: UniApp.InnerAudioContext | null = null;

const isH5 = typeof window !== 'undefined' && typeof fetch === 'function';

/** 麦克风 / 录音权限类错误 → 中文提示（H5 Edge InPrivate 等） */
export function formatMicPermissionError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const lower = msg.toLowerCase();
  if (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    lower.includes('permission denied') ||
    lower.includes('notallowederror') ||
    lower.includes('not allowed')
  ) {
    return '请在浏览器设置中允许麦克风';
  }
  if (name === 'NotFoundError' || lower.includes('notfounderror') || lower.includes('device not found')) {
    return '未检测到麦克风设备';
  }
  if (msg && msg !== '[object Object]') return msg;
  return '录音失败';
}

let h5Stream: MediaStream | null = null;
let h5Recorder: MediaRecorder | null = null;
let h5Chunks: Blob[] = [];
let h5StartTime = 0;

function getUniRecorder(): UniApp.RecorderManager | null {
  if (recorder !== undefined) return recorder;
  try {
    const rm = uni.getRecorderManager?.();
    recorder = rm && typeof rm.onStart === 'function' ? rm : null;
  } catch {
    recorder = null;
  }
  return recorder;
}

function canUseH5Recorder(): boolean {
  return (
    isH5 &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  );
}

function pickH5AudioMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

function cleanupH5Recording() {
  h5Recorder = null;
  h5Chunks = [];
  h5StartTime = 0;
  if (h5Stream) {
    h5Stream.getTracks().forEach((t) => t.stop());
    h5Stream = null;
  }
}

async function startH5VoiceRecord(): Promise<void> {
  cleanupH5Recording();
  try {
    h5Stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (err) {
    cleanupH5Recording();
    throw new Error(formatMicPermissionError(err));
  }
  const mimeType = pickH5AudioMimeType();
  h5Recorder = mimeType ? new MediaRecorder(h5Stream, { mimeType }) : new MediaRecorder(h5Stream);
  h5Chunks = [];
  h5Recorder.ondataavailable = (e) => {
    if (e.data.size > 0) h5Chunks.push(e.data);
  };
  h5StartTime = Date.now();
  h5Recorder.start();
}

function stopH5VoiceRecord(): Promise<VoiceRecording> {
  return new Promise((resolve, reject) => {
    const rec = h5Recorder;
    if (!rec || rec.state === 'inactive') {
      cleanupH5Recording();
      reject(new Error('未在录音'));
      return;
    }
    rec.onstop = () => {
      const mimeType = rec.mimeType || h5Chunks[0]?.type || 'audio/webm';
      const blob = new Blob(h5Chunks, { type: mimeType });
      const durationSec = Math.max(
        1,
        Math.min(MAX_VOICE_SEC, Math.round((Date.now() - h5StartTime) / 1000)),
      );
      const tempFilePath = URL.createObjectURL(blob);
      cleanupH5Recording();
      resolve({ tempFilePath, durationSec, mimeType });
    };
    rec.onerror = () => {
      cleanupH5Recording();
      reject(new Error('录音失败'));
    };
    rec.stop();
  });
}

/** 按住开始录音 */
export function startVoiceRecord(): Promise<void> {
  // H5 优先走 getUserMedia，避免 uni 录音器在 Edge InPrivate 等场景抛出英文 Permission denied
  if (canUseH5Recorder()) {
    return startH5VoiceRecord();
  }
  const rm = getUniRecorder();
  if (rm) {
    return new Promise((resolve, reject) => {
      rm.onStart(() => resolve());
      rm.onError((err) => reject(new Error(formatMicPermissionError(new Error(err.errMsg || '录音失败')))));
      rm.start({
        duration: MAX_VOICE_SEC * 1000,
        format: 'mp3',
        sampleRate: 16000,
        numberOfChannels: 1,
      });
    });
  }
  return Promise.reject(new Error('当前浏览器不支持录音'));
}

/** 松开结束录音 */
export function stopVoiceRecord(): Promise<VoiceRecording> {
  const rm = getUniRecorder();
  if (rm) {
    return new Promise((resolve, reject) => {
      rm.onStop((res) => {
        const durationSec = Math.max(1, Math.min(MAX_VOICE_SEC, Math.round((res.duration || 1000) / 1000)));
        resolve({
          tempFilePath: res.tempFilePath,
          durationSec,
          mimeType: 'audio/mpeg',
        });
      });
      rm.onError((err) => reject(new Error(formatMicPermissionError(new Error(err.errMsg || '录音失败')))));
      rm.stop();
    });
  }
  return stopH5VoiceRecord();
}

/** 取消录音 */
export function cancelVoiceRecord() {
  const rm = getUniRecorder();
  if (rm) {
    try {
      rm.stop();
    } catch {
      /* ignore */
    }
    return;
  }
  cleanupH5Recording();
}

/** 本地录音文件 → base64（供 JSON 上传） */
export async function voiceFileToBase64(filePath: string): Promise<string> {
  if (isH5) {
    const res = await fetch(filePath);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const comma = dataUrl.indexOf(',');
        resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
      };
      reader.onerror = () => reject(new Error('读取录音失败'));
      reader.readAsDataURL(blob);
    });
  }
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (r) => resolve(String(r.data || '')),
      fail: (e) => reject(new Error(e.errMsg || '读取录音失败')),
    });
  });
}

export function stopVoicePlayback() {
  if (activePlayer) {
    activePlayer.stop();
    activePlayer.destroy();
    activePlayer = null;
  }
}

/** 播放语音（data URL 或 http URL） */
export function playVoiceAudio(src: string): Promise<void> {
  stopVoicePlayback();
  return new Promise((resolve, reject) => {
    const player = uni.createInnerAudioContext();
    activePlayer = player;
    player.src = src;
    player.onEnded(() => {
      stopVoicePlayback();
      resolve();
    });
    player.onError(() => {
      stopVoicePlayback();
      reject(new Error('播放失败'));
    });
    player.play();
  });
}

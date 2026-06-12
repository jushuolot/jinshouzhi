/** 订单密聊 · 录音与播放（H5 / 小程序） */

const MAX_VOICE_SEC = 60;

export interface VoiceRecording {
  tempFilePath: string;
  durationSec: number;
  mimeType: string;
}

let recorder: UniApp.RecorderManager | null = null;
let activePlayer: UniApp.InnerAudioContext | null = null;

function getRecorder() {
  if (!recorder) recorder = uni.getRecorderManager();
  return recorder;
}

/** 按住开始录音 */
export function startVoiceRecord(): Promise<void> {
  return new Promise((resolve, reject) => {
    const rm = getRecorder();
    rm.onStart(() => resolve());
    rm.onError((err) => reject(new Error(err.errMsg || '录音失败')));
    rm.start({
      duration: MAX_VOICE_SEC * 1000,
      format: 'mp3',
      sampleRate: 16000,
      numberOfChannels: 1,
    });
  });
}

/** 松开结束录音 */
export function stopVoiceRecord(): Promise<VoiceRecording> {
  return new Promise((resolve, reject) => {
    const rm = getRecorder();
    rm.onStop((res) => {
      const durationSec = Math.max(1, Math.min(MAX_VOICE_SEC, Math.round((res.duration || 1000) / 1000)));
      resolve({
        tempFilePath: res.tempFilePath,
        durationSec,
        mimeType: 'audio/mpeg',
      });
    });
    rm.onError((err) => reject(new Error(err.errMsg || '录音失败')));
    rm.stop();
  });
}

/** 取消录音 */
export function cancelVoiceRecord() {
  try {
    getRecorder().stop();
  } catch {
    /* ignore */
  }
}

/** 本地录音文件 → base64（供 JSON 上传） */
export async function voiceFileToBase64(filePath: string): Promise<string> {
  const isH5 = typeof window !== 'undefined' && typeof fetch === 'function';
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

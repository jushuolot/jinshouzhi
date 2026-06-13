import {
  pollOrderCallSignals,
  postOrderCallSignal,
  type CallSignal,
  type IceServerConfig,
} from '../api/order-call';
import { formatMicPermissionError } from './voice-chat';

export type VoiceCallStatus = 'connecting' | 'connected' | 'ended' | 'error';

export interface WebRtcVoiceSession {
  hangup: () => void;
  setMuted: (muted: boolean) => void;
  cleanup: () => void;
}

function toRtcIceServers(servers: IceServerConfig[]): RTCIceServer[] {
  return servers.map((s) => ({
    urls: s.urls,
    username: s.username,
    credential: s.credential,
  }));
}

export async function startWebRtcVoiceCall(options: {
  orderId: string;
  clientId: string;
  iceServers: IceServerConfig[];
  isInitiator: boolean;
  onStatus: (status: VoiceCallStatus) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onError?: (msg: string) => void;
}): Promise<WebRtcVoiceSession> {
  const {
    orderId,
    clientId,
    iceServers,
    isInitiator,
    onStatus,
    onRemoteStream,
    onError,
  } = options;

  let pollSince = 0;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let ended = false;
  let localStream: MediaStream | null = null;
  let peerJoined = false;
  let makingOffer = false;

  const pc = new RTCPeerConnection({ iceServers: toRtcIceServers(iceServers) });

  pc.ontrack = (ev) => {
    const stream = ev.streams[0];
    if (stream) {
      onRemoteStream(stream);
      onStatus('connected');
    }
  };

  pc.onicecandidate = (ev) => {
    if (!ev.candidate || ended) return;
    postOrderCallSignal(orderId, {
      type: 'ice',
      clientId,
      candidate: ev.candidate.toJSON(),
    }).catch(() => {});
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') onStatus('connected');
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      onError?.('连接中断');
    }
  };

  async function addLocalAudio() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      throw new Error(formatMicPermissionError(err));
    }
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
  }

  async function createOffer() {
    if (makingOffer || ended) return;
    makingOffer = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await postOrderCallSignal(orderId, {
        type: 'offer',
        clientId,
        sdp: offer,
      });
    } finally {
      makingOffer = false;
    }
  }

  async function handleSignal(sig: CallSignal) {
    if (ended) return;
    if (sig.type === 'join') {
      if (sig.clientId === clientId) return;
      peerJoined = true;
      if (isInitiator) await createOffer();
      return;
    }
    if (sig.type === 'offer' && sig.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await postOrderCallSignal(orderId, {
        type: 'answer',
        clientId,
        sdp: answer,
      });
      return;
    }
    if (sig.type === 'answer' && sig.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
      return;
    }
    if (sig.type === 'ice' && sig.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
      } catch {
        /* ignore stale candidates */
      }
      return;
    }
    if (sig.type === 'hangup') {
      cleanup();
      onStatus('ended');
    }
  }

  async function pollOnce() {
    if (ended) return;
    try {
      const res = await pollOrderCallSignals(orderId, clientId, pollSince);
      pollSince = res.since;
      for (const sig of res.signals) {
        await handleSignal(sig);
      }
      if (res.status === 'ended') {
        cleanup();
        onStatus('ended');
      }
    } catch {
      /* polling errors are non-fatal for MVP */
    }
  }

  function cleanup() {
    if (ended) return;
    ended = true;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (localStream) {
      for (const t of localStream.getTracks()) t.stop();
      localStream = null;
    }
    pc.close();
  }

  async function hangup() {
    if (ended) return;
    try {
      await postOrderCallSignal(orderId, { type: 'hangup', clientId });
    } catch {
      /* ignore */
    }
    cleanup();
    onStatus('ended');
  }

  function setMuted(muted: boolean) {
    if (!localStream) return;
    for (const t of localStream.getAudioTracks()) {
      t.enabled = !muted;
    }
  }

  onStatus('connecting');
  await addLocalAudio();
  await postOrderCallSignal(orderId, { type: 'join', clientId });
  if (isInitiator) {
    pollOnce().then(() => {
      if (!peerJoined && !ended) {
        /* wait for peer via poll loop */
      }
    });
  }
  pollTimer = setInterval(() => {
    pollOnce();
  }, 1000);

  return { hangup, setMuted, cleanup };
}

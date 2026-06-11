/** 本地 Vite dev：核验照落盘到 dev-data/verification-photos/ */

export function isLocalDevHost(): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export async function saveVerificationPhotoToDevDisk(
  userId: string,
  dataUrl: string,
): Promise<string | null> {
  if (!isLocalDevHost() || !dataUrl.startsWith('data:image/')) return null;
  try {
    const res = await fetch('/__dev/save-verification-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, dataUrl }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    if (!data.url) return null;
    return new URL(data.url, window.location.origin).href;
  } catch {
    return null;
  }
}

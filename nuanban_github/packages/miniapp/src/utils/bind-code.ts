const PREFIX = 'NUANBAN:elder:';

export function encodeElderBindCode(elderId: string): string {
  return `${PREFIX}${elderId}`;
}

export function parseElderBindCode(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;
  if (s.startsWith(PREFIX)) return s.slice(PREFIX.length) || null;
  if (s.startsWith('elder-')) return s;
  const fromUrl = s.match(/[?&]code=([^&]+)/)?.[1];
  if (fromUrl) return parseElderBindCode(decodeURIComponent(fromUrl));
  return null;
}

export function familyBindPageUrl(elderId: string): string {
  const code = encodeURIComponent(encodeElderBindCode(elderId));
  return `/package-family/bind?code=${code}`;
}

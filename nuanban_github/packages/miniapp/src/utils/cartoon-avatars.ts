/** 学生端卡通头像预设（MSN 风格 · 非真实照片） */
export interface CartoonAvatar {
  id: string;
  label: string;
  url: string;
}

function msnAvatar(face: string, shirt: string, bg: string, frame: string): string {
  const body = `<rect x="8" y="8" width="104" height="104" rx="18" fill="${bg}" stroke="${frame}" stroke-width="4"/>${face}<ellipse cx="60" cy="98" rx="28" ry="14" fill="${shirt}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const CARTOON_AVATARS: CartoonAvatar[] = [
  {
    id: 'msn-happy',
    label: '开心',
    url: msnAvatar(
      '<circle cx="60" cy="48" r="22" fill="#ffe0bd"/><circle cx="52" cy="46" r="3" fill="#333"/><circle cx="68" cy="46" r="3" fill="#333"/><path d="M50 56 Q60 64 70 56" stroke="#333" stroke-width="2.5" fill="none"/>',
      '#4a90d9',
      '#e8f4ff',
      '#2d6cdf',
    ),
  },
  {
    id: 'msn-cool',
    label: '酷',
    url: msnAvatar(
      '<circle cx="60" cy="48" r="22" fill="#ffe0bd"/><rect x="46" y="44" width="28" height="8" rx="2" fill="#333"/><path d="M52 58 L68 58" stroke="#333" stroke-width="2.5"/>',
      '#5c4d7d',
      '#f0ecff',
      '#7b61ff',
    ),
  },
  {
    id: 'msn-wink',
    label: '眨眼',
    url: msnAvatar(
      '<circle cx="60" cy="48" r="22" fill="#ffe0bd"/><path d="M48 46 L56 46" stroke="#333" stroke-width="3"/><circle cx="68" cy="46" r="3" fill="#333"/><path d="M52 58 Q60 64 70 56" stroke="#333" stroke-width="2.5" fill="none"/>',
      '#e76f51',
      '#fff0eb',
      '#d45d3a',
    ),
  },
  {
    id: 'msn-shy',
    label: '害羞',
    url: msnAvatar(
      '<circle cx="60" cy="48" r="22" fill="#ffe0bd"/><circle cx="52" cy="48" r="3" fill="#333"/><circle cx="68" cy="48" r="3" fill="#333"/><ellipse cx="48" cy="54" rx="5" ry="3" fill="#f4a6a6" opacity="0.7"/><ellipse cx="72" cy="54" rx="5" ry="3" fill="#f4a6a6" opacity="0.7"/>',
      '#2a9d8f',
      '#e8faf7',
      '#1f7a6c',
    ),
  },
  {
    id: 'msn-star',
    label: '星星',
    url: msnAvatar(
      '<circle cx="60" cy="48" r="22" fill="#ffe0bd"/><polygon points="60,32 63,40 72,40 65,46 68,54 60,49 52,54 55,46 48,40 57,40" fill="#ffd166"/><circle cx="52" cy="48" r="2.5" fill="#333"/><circle cx="68" cy="48" r="2.5" fill="#333"/>',
      '#f4a261',
      '#fff8e8',
      '#e07b2d',
    ),
  },
  {
    id: 'msn-bear',
    label: '小熊',
    url: msnAvatar(
      '<circle cx="42" cy="34" r="10" fill="#c9a66b"/><circle cx="78" cy="34" r="10" fill="#c9a66b"/><circle cx="60" cy="50" r="24" fill="#d4a574"/><circle cx="52" cy="48" r="3" fill="#333"/><circle cx="68" cy="48" r="3" fill="#333"/><ellipse cx="60" cy="56" rx="5" ry="4" fill="#8b6914"/>',
      '#8b6914',
      '#faf3e8',
      '#a67c52',
    ),
  },
  {
    id: 'msn-flower',
    label: '花朵',
    url: msnAvatar(
      '<circle cx="60" cy="48" r="22" fill="#ffe0bd"/><circle cx="60" cy="30" r="8" fill="#f4acb7"/><circle cx="48" cy="34" r="6" fill="#ffb3c1"/><circle cx="72" cy="34" r="6" fill="#ffb3c1"/><circle cx="52" cy="46" r="2.5" fill="#333"/><circle cx="68" cy="46" r="2.5" fill="#333"/>',
      '#e64980',
      '#fff0f6',
      '#d6336c',
    ),
  },
  {
    id: 'msn-sun',
    label: '阳光',
    url: msnAvatar(
      '<circle cx="60" cy="48" r="22" fill="#ffe0bd"/><circle cx="52" cy="46" r="3" fill="#333"/><circle cx="68" cy="46" r="3" fill="#333"/><path d="M50 58 Q60 66 70 58" stroke="#333" stroke-width="2.5" fill="none"/><g stroke="#ffd43b" stroke-width="3"><line x1="60" y1="14" x2="60" y2="22"/><line x1="60" y1="74" x2="60" y2="82"/><line x1="26" y1="48" x2="34" y2="48"/><line x1="86" y1="48" x2="94" y2="48"/></g>',
      '#fab005',
      '#fff9db',
      '#f59f00',
    ),
  },
];

export function resolveCartoonAvatarUrl(id?: string | null, customUrl?: string | null): string {
  if (customUrl) return customUrl;
  const found = CARTOON_AVATARS.find((a) => a.id === id);
  return found?.url || CARTOON_AVATARS[0].url;
}

export function defaultCartoonAvatarId(seed = ''): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % CARTOON_AVATARS.length;
  return CARTOON_AVATARS[idx].id;
}

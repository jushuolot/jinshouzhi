/** 学生端卡通头像预设（非真实照片） */
export interface CartoonAvatar {
  id: string;
  label: string;
  /** SVG data URL */
  url: string;
}

function svgAvatar(body: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="${bg}"/>${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const CARTOON_AVATARS: CartoonAvatar[] = [
  {
    id: 'student-orange',
    label: '暖橙',
    url: svgAvatar(
      '<circle cx="60" cy="52" r="28" fill="#ffe8d6"/><ellipse cx="60" cy="98" rx="34" ry="22" fill="#f4a261"/><circle cx="48" cy="50" r="4" fill="#3d2a1f"/><circle cx="72" cy="50" r="4" fill="#3d2a1f"/><path d="M52 62 Q60 68 68 62" stroke="#3d2a1f" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M44 38 Q60 24 76 38" stroke="#5c3d2e" stroke-width="6" fill="none" stroke-linecap="round"/>',
      '#fff5ef',
    ),
  },
  {
    id: 'student-teal',
    label: '青柠',
    url: svgAvatar(
      '<circle cx="60" cy="52" r="28" fill="#dff7f0"/><ellipse cx="60" cy="98" rx="34" ry="22" fill="#2a9d8f"/><circle cx="48" cy="50" r="4" fill="#1d3557"/><circle cx="72" cy="50" r="4" fill="#1d3557"/><path d="M52 63 Q60 69 68 63" stroke="#1d3557" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="34" y="30" width="52" height="14" rx="7" fill="#264653"/>',
      '#e8f8f5',
    ),
  },
  {
    id: 'student-violet',
    label: '紫藤',
    url: svgAvatar(
      '<circle cx="60" cy="52" r="28" fill="#f0e6ff"/><ellipse cx="60" cy="98" rx="34" ry="22" fill="#7b61ff"/><circle cx="48" cy="50" r="4" fill="#2d1b4e"/><circle cx="72" cy="50" r="4" fill="#2d1b4e"/><path d="M52 62 Q60 68 68 62" stroke="#2d1b4e" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M38 42 C48 18 72 18 82 42" stroke="#5a3ea1" stroke-width="7" fill="none" stroke-linecap="round"/>',
      '#f6f0ff',
    ),
  },
  {
    id: 'student-sky',
    label: '晴空',
    url: svgAvatar(
      '<circle cx="60" cy="52" r="28" fill="#e3f2fd"/><ellipse cx="60" cy="98" rx="34" ry="22" fill="#457b9d"/><circle cx="48" cy="50" r="4" fill="#1d3557"/><circle cx="72" cy="50" r="4" fill="#1d3557"/><path d="M52 63 Q60 69 68 63" stroke="#1d3557" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M42 36 L78 36 L60 22 Z" fill="#1d3557"/>',
      '#eef6ff',
    ),
  },
  {
    id: 'student-rose',
    label: '浅樱',
    url: svgAvatar(
      '<circle cx="60" cy="52" r="28" fill="#ffe4ec"/><ellipse cx="60" cy="98" rx="34" ry="22" fill="#e76f51"/><circle cx="48" cy="50" r="4" fill="#3d2a1f"/><circle cx="72" cy="50" r="4" fill="#3d2a1f"/><path d="M52 62 Q60 68 68 62" stroke="#3d2a1f" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="60" cy="30" r="12" fill="#f4acb7"/>',
      '#fff0f3',
    ),
  },
  {
    id: 'student-lemon',
    label: '柠檬',
    url: svgAvatar(
      '<circle cx="60" cy="52" r="28" fill="#fff9db"/><ellipse cx="60" cy="98" rx="34" ry="22" fill="#f4a261"/><circle cx="48" cy="50" r="4" fill="#3d2a1f"/><circle cx="72" cy="50" r="4" fill="#3d2a1f"/><path d="M52 62 Q60 68 68 62" stroke="#3d2a1f" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M40 40 Q60 28 80 40" stroke="#bc6c25" stroke-width="6" fill="none" stroke-linecap="round"/>',
      '#fffbea',
    ),
  },
];

export function resolveCartoonAvatarUrl(id?: string | null): string {
  const found = CARTOON_AVATARS.find((a) => a.id === id);
  return found?.url || CARTOON_AVATARS[0].url;
}

export function defaultCartoonAvatarId(seed = ''): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % CARTOON_AVATARS.length;
  return CARTOON_AVATARS[idx].id;
}

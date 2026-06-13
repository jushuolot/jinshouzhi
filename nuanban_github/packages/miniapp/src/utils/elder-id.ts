/** 兼容旧 id：elder-zhang 等映射到富数据 elder-1（与 demo-rich-data 一致） */
const LEGACY_ELDER_IDS: Record<string, string> = {
  'elder-zhang': 'elder-1',
  'elder-li': 'elder-2',
  'elder-wang': 'elder-3',
};

export function normalizeElderId(id: string): string {
  return LEGACY_ELDER_IDS[id] || id;
}

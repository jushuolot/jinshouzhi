/** 列表关键词搜索（前端过滤或拼 API q 参数） */

export function normalizeSearchKeyword(raw: string): string {
  return String(raw || '').trim().toLowerCase();
}

export function matchListKeyword(
  keyword: string,
  fields: Array<string | number | null | undefined | boolean>,
): boolean {
  const q = normalizeSearchKeyword(keyword);
  if (!q) return true;
  const hay = fields.map((f) => String(f ?? '')).join(' ').toLowerCase();
  return hay.includes(q);
}

/** 平台已知合作院校（仅允许从此列表选择，禁止自填虚假学校） */
export const KNOWN_SCHOOLS: readonly string[] = [
  '示范大学',
  '城东师范学院',
  '医科大学',
  '复旦大学',
  '上海交通大学',
  '同济大学',
  '华东师范大学',
  '上海大学',
  '南京大学',
  '东南大学',
  '浙江大学',
  '中国科学技术大学',
  '北京大学',
  '清华大学',
  '中国人民大学',
  '北京师范大学',
  '武汉大学',
  '华中科技大学',
  '中山大学',
  '华南理工大学',
  '四川大学',
  '电子科技大学',
  '西安交通大学',
  '哈尔滨工业大学',
  '吉林大学',
  '厦门大学',
  '山东大学',
  '中南大学',
  '湖南大学',
  '重庆大学',
] as const;

export function isKnownSchool(name: string): boolean {
  const t = name.trim();
  return KNOWN_SCHOOLS.some((s) => s === t);
}

export function searchKnownSchools(keyword: string, limit = 8): string[] {
  const q = keyword.trim();
  if (!q) return [...KNOWN_SCHOOLS].slice(0, limit);
  return KNOWN_SCHOOLS.filter((s) => s.includes(q)).slice(0, limit);
}

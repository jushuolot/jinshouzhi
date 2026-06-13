/** 学生端展示名：优先资料里的「显示名称」，避免占位符「学生」 */
export function studentGreetingName(profile?: {
  displayName?: string;
  nickname?: string;
} | null): string {
  const display = profile?.displayName?.trim();
  if (display) return display;
  const nick = profile?.nickname?.trim();
  if (nick && nick !== '学生') return nick;
  return '同学';
}

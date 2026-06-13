/** H5 hash 路由下 onLoad 偶发拿不到 query，从页面栈 options 补读 */
export function readRouteQuery(
  q: Record<string, string | undefined> | undefined,
  key: string,
): string {
  const fromLoad = q?.[key];
  if (fromLoad) return String(fromLoad);
  const pages = getCurrentPages();
  const cur = pages[pages.length - 1] as { options?: Record<string, string> } | undefined;
  const fromPage = cur?.options?.[key];
  return fromPage ? String(fromPage) : '';
}

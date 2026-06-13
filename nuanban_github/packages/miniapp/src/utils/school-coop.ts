import { ORG_SCHOOL_PARTNERS } from './demo-rich-data';
import { isDemoMockEnabled } from './demo-mock';
import { request } from '../utils/request';

let partnersCache: Record<string, string[]> | null = null;

export async function loadOrgSchoolPartners(): Promise<Record<string, string[]>> {
  if (isDemoMockEnabled()) return ORG_SCHOOL_PARTNERS;
  if (partnersCache) return partnersCache;
  const res = await request<{ byOrg: Record<string, string[]> }>({
    url: '/nuanban/school-cooperation/partners',
    method: 'GET',
  });
  partnersCache = res.byOrg ?? {};
  return partnersCache;
}

export function clearOrgSchoolPartnersCache() {
  partnersCache = null;
}

export function orgPartnersSchool(
  orgId: string,
  schoolName: string,
  partners?: Record<string, string[]>,
): boolean {
  if (!schoolName) return true;
  const map = partners ?? (isDemoMockEnabled() ? ORG_SCHOOL_PARTNERS : partnersCache ?? {});
  const list = map[orgId];
  if (!list || !list.length) return true;
  return list.includes(schoolName);
}

export function filterEldersBySchoolCoop<
  T extends { org?: string; expand?: { org?: { id: string; name?: string } } },
>(items: T[], schoolName: string, partners?: Record<string, string[]>): T[] {
  return items.filter((e) => {
    const orgId = (e.org as string) || e.expand?.org?.id || '';
    return orgPartnersSchool(orgId, schoolName, partners);
  });
}

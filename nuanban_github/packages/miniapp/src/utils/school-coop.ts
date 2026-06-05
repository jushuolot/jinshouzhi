import { ORG_SCHOOL_PARTNERS } from './demo-rich-data';

export function orgPartnersSchool(orgId: string, schoolName: string): boolean {
  if (!schoolName) return true;
  const partners = ORG_SCHOOL_PARTNERS[orgId];
  if (!partners) return true;
  return partners.includes(schoolName);
}

export function filterEldersBySchoolCoop<
  T extends { org?: string; expand?: { org?: { id: string; name?: string } } },
>(items: T[], schoolName: string): T[] {
  return items.filter((e) => {
    const orgId = (e.org as string) || e.expand?.org?.id || '';
    return orgPartnersSchool(orgId, schoolName);
  });
}

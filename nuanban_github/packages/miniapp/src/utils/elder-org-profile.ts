/** 老人机构档案 · 展示文案（机构字段由 PB Admin 维护，本人不可改） */

export const ELDER_ORG_EMPTY_LABEL = '未填写（待机构补充）';

export const ELDER_ORG_PROFILE_HINT =
  '机构档案待补充，可请家属联系养老院，由运营在「运营台 → 机构 → 老人机构档案」填写。';

export const ELDER_ORG_OPS_HINT =
  '请在运营台「机构」页维护老人所在区域、健康状况、居住情况等机构字段。';

export function isElderOrgProfileComplete(profile: {
  orgName?: string;
  district?: string;
  healthStatus?: string;
  mobility?: string;
  livingSituation?: string;
  orgProfileComplete?: boolean;
} | null | undefined): boolean {
  if (!profile) return false;
  if (profile.orgProfileComplete === true) return true;
  if (profile.orgProfileComplete === false) return false;
  return !!(
    profile.orgName?.trim()
    && profile.district?.trim()
    && profile.healthStatus?.trim()
    && profile.mobility?.trim()
    && profile.livingSituation?.trim()
  );
}

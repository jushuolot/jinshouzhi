import type { StudentProfile } from '../api/student';
import { isKnownSchool } from './known-schools';
import { isValidCnMobile } from './login-phone';

/** 学生审核提报资料是否完整（注册/待审展示所需） */
export function isStudentAuditProfileComplete(p: Partial<StudentProfile> | null | undefined): boolean {
  if (!p) return false;
  if (p.profileComplete === false) return false;
  const hasAvatar = !!(p.cartoonAvatarId || p.customCartoonAvatarUrl);
  const hasAreas = (p.serviceAreaPolygons || []).some((poly) => (poly.ring || []).length >= 3);
  const hasHours = (p.serviceHours || []).length > 0;
  return !!(
    p.displayName?.trim()
    && isKnownSchool(p.schoolName || '')
    && isValidCnMobile(p.contactPhone || '')
    && p.verificationPhotoUrl
    && hasAvatar
    && hasAreas
    && hasHours
  );
}

export const STUDENT_REGISTER_URL = '/pages/common/register?role=student&step=form';

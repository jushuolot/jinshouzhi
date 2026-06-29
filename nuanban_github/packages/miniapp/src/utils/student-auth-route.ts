import type { LoginResult } from '../api/auth';
import { fetchStudentProfile } from '../api/student';
import { ROLE_HOME } from '../config/tabs';
import { useRoleStore } from '../store/role';
import { isStudentAuditProfileComplete, STUDENT_REGISTER_URL } from './student-audit-profile';

/** 登录后学生身份路由：无角色→登记；待审/被拒→待审页；已通过但资料不全→登记；否则进首页 */
export async function routeStudentAfterAuth(login?: LoginResult): Promise<void> {
  const roleStore = useRoleStore();
  const roles = login?.roles ?? roleStore.roles;
  const student = roles.find((r) => r.role === 'student');

  if (!student) {
    uni.reLaunch({ url: '/pages/common/register?role=student' });
    return;
  }

  let status = student.status;
  if (status === 'pending' || status === 'rejected') {
    try {
      const profile = await fetchStudentProfile();
      if (profile.auditStatus === 'active') {
        roleStore.setStudentRoleStatus('active');
        status = 'active';
      } else {
        uni.reLaunch({ url: '/pages/common/student-pending' });
        return;
      }
    } catch {
      uni.reLaunch({ url: '/pages/common/student-pending' });
      return;
    }
  }

  if (status === 'active') {
    try {
      const profile = await fetchStudentProfile();
      if (!isStudentAuditProfileComplete(profile)) {
        uni.reLaunch({ url: STUDENT_REGISTER_URL });
        return;
      }
    } catch {
      uni.reLaunch({ url: STUDENT_REGISTER_URL });
      return;
    }
    roleStore.setActiveRole('student');
    uni.reLaunch({ url: ROLE_HOME.student });
    return;
  }

  uni.reLaunch({ url: '/pages/common/student-pending' });
}

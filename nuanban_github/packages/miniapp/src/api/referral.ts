import { request } from '../utils/request';

export interface ReferralRecord {
  id: string;
  inviteeName: string;
  status: 'registered' | 'first_order' | 'rewarded';
  rewardCents: number;
  createdAt: string;
  rewardedAt?: string;
}

export interface StudentReferralOverview {
  code: string;
  inviteLink: string;
  rewardPerInviteCents: number;
  rewardOnFirstOrderCents: number;
  invitedCount: number;
  rewardedCount: number;
  pendingRewardCents: number;
  totalEarnedCents: number;
  records: ReferralRecord[];
}

export async function fetchStudentReferral() {
  return request<StudentReferralOverview>({
    url: '/nuanban/student/referral',
    method: 'GET',
  });
}

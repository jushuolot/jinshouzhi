import { request } from '../utils/request';
import { pbList, type PbRecord } from './pb';

export interface PendingOrder {
  id: string;
  elderId: string;
  elderName?: string;
  serviceName?: string;
  durationMinutes?: number;
  amountCents?: number;
  scheduledAt?: string;
  status: string;
  requiresOutdoorApproval?: boolean;
  distanceKm?: number;
}

export interface StudentOrderDetail extends PendingOrder {
  elderIntro?: string;
  orgName?: string;
}

export interface IncomeRecord {
  id: string;
  elderName: string;
  serviceName: string;
  amountCents: number;
  completedAt: string;
}

export interface StudentIncome {
  monthIncomeCents: number;
  monthIncomeYuan: string;
  totalIncomeCents: number;
  totalIncomeYuan: string;
  records: IncomeRecord[];
}

export interface SosAlert {
  id: string;
  elderId: string;
  elderName: string;
  message: string;
  createdAt: string;
  status: string;
}

export interface StudentProfile {
  nickname: string;
  email: string;
  schoolName: string;
  displayName: string;
  gender?: string;
  major?: string;
  grade?: string;
  age?: number;
  phone?: string;
  bio?: string;
  serviceAreas?: string[];
  availableHours?: string[];
  certifications?: string[];
  languages?: string[];
  personalityTags?: string[];
  serviceTypes?: string[];
  completedOrderThemes?: string[];
  rating?: number;
  orderCount?: number;
}

export interface ElderProfileDetail {
  id: string;
  name: string;
  age: number;
  gender: string;
  district: string;
  address: string;
  orgName: string;
  tags: string[];
  intro: string;
  healthStatus: string;
  mobility: string;
  hobbies: string[];
  servicePreferences: string[];
  livingSituation: string;
  emergencyContact: { name: string; relation: string; phone: string };
  preferredVisitTimes: string[];
  notes: string;
}

export interface StudentStats {
  acceptedCount: number;
  monthCount: number;
  pendingCount?: number;
  incomeCents: number;
  incomeYuan: string;
}

export async function fetchStudentProfile() {
  return request<StudentProfile>({
    url: '/nuanban/student/profile',
    method: 'GET',
  });
}

export async function updateStudentProfile(data: {
  displayName?: string;
  schoolName?: string;
  bio?: string;
  major?: string;
  grade?: string;
  availableHours?: string[];
  serviceAreas?: string[];
}) {
  return request<{ ok: boolean } & Partial<StudentProfile>>({
    url: '/nuanban/student/profile',
    method: 'PATCH',
    data,
  });
}

export async function fetchElderProfile(elderId: string) {
  return request<ElderProfileDetail>({
    url: `/nuanban/student/elders/${elderId}/profile`,
    method: 'GET',
  });
}

export async function fetchStudentStats() {
  return request<StudentStats>({
    url: '/nuanban/student/stats',
    method: 'GET',
  });
}

export async function listPendingOrders() {
  const res = await request<{ list: PendingOrder[] }>({
    url: '/nuanban/student/orders/pending',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function acceptOrder(orderId: string) {
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/student/order-requests/${orderId}/accept`,
    method: 'POST',
  });
}

export async function rejectOrder(orderId: string, reason?: string) {
  return request<{ ok: boolean }>({
    url: `/nuanban/student/order-requests/${orderId}/reject`,
    method: 'POST',
    data: { reason: reason || '时间冲突' },
  });
}

export async function getStudentOrder(orderId: string) {
  return request<StudentOrderDetail>({
    url: `/nuanban/student/orders/${orderId}`,
    method: 'GET',
  });
}

export async function listActiveOrders() {
  const res = await request<{ list: PendingOrder[] }>({
    url: '/nuanban/student/orders/active',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function startOrder(orderId: string) {
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/student/orders/${orderId}/start`,
    method: 'POST',
  });
}

/** 到场签到（地理围栏校验后等同开始服务） */
export async function checkinOrder(orderId: string, lat: number, lng: number) {
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/student/orders/${orderId}/checkin`,
    method: 'POST',
    data: { lat, lng },
  });
}

export async function completeOrder(orderId: string) {
  return request<{ ok: boolean; status: string }>({
    url: `/nuanban/student/orders/${orderId}/complete`,
    method: 'POST',
  });
}

export async function fetchStudentIncome() {
  return request<StudentIncome>({
    url: '/nuanban/student/income',
    method: 'GET',
  });
}

export interface SettlementRecord {
  id: string;
  period: string;
  amountCents: number;
  status: 'pending' | 'paid';
  paidAt?: string;
}

export async function fetchStudentSettlements() {
  const res = await request<{ list: SettlementRecord[] }>({
    url: '/nuanban/student/settlements',
    method: 'GET',
  });
  return res.list ?? [];
}

export type WithdrawalChannel = 'wechat' | 'bank';

export interface StudentWithdrawalRecord {
  id: string;
  amountCents: number;
  channel: WithdrawalChannel;
  channelLabel: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface StudentWithdrawalOverview {
  availableCents: number;
  availableYuan: string;
  frozenCents: number;
  frozenYuan: string;
  boundWechat: string;
  boundBank: string;
  withdrawals: StudentWithdrawalRecord[];
}

export async function fetchStudentWithdrawal() {
  return request<StudentWithdrawalOverview>({
    url: '/nuanban/student/withdrawal',
    method: 'GET',
  });
}

export async function submitStudentWithdrawal(amountCents: number, channel: WithdrawalChannel) {
  return request<StudentWithdrawalOverview>({
    url: '/nuanban/student/withdrawal',
    method: 'POST',
    data: { amountCents, channel },
  });
}

export async function listActiveSosAlerts() {
  const res = await request<{ list: SosAlert[] }>({
    url: '/nuanban/student/sos/active',
    method: 'GET',
  });
  return res.list ?? [];
}

export async function acknowledgeSosAlert(alertId: string) {
  return request<{ ok: boolean }>({
    url: `/nuanban/student/sos/${alertId}/ack`,
    method: 'POST',
  });
}

export interface ScheduleItem {
  id: string;
  orderId: string;
  elderName: string;
  serviceName: string;
  status: string;
  scheduledStart?: string;
}

export async function listStudentSchedules() {
  const res = await request<{ list: ScheduleItem[] }>({
    url: '/nuanban/student/schedules',
    method: 'GET',
  });
  return res.list ?? [];
}

export interface ServiceLogItem {
  id: string;
  orderId: string;
  elderId: string;
  elderName: string;
  serviceName: string;
  summary: string;
  createdAt: string;
}

export async function listServiceLogs() {
  const res = await request<{ list: ServiceLogItem[] }>({
    url: '/nuanban/student/service-logs',
    method: 'GET',
  });
  return res.list ?? [];
}

export interface ElderRow extends PbRecord {
  name: string;
  latitude?: number;
  longitude?: number;
  org?: string;
  expand?: { org?: { id: string; name: string } };
}

export async function getElderDetail(id: string) {
  const res = await pbList<ElderRow>('elders', {
    filter: `id = "${id}"`,
    expand: 'org',
    perPage: 1,
  });
  return res.items[0] ?? null;
}

/** 附近老人（走后端自定义路由，避免直连 collections API 权限/expand 问题） */
export async function listNearbyElders(lat: number, lng: number, radiusKm = 5) {
  const res = await request<{ list: (ElderRow & { distanceKm: number; orgName?: string })[] }>({
    url: `/nuanban/student/elders/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`,
    method: 'GET',
  });
  return (res.list ?? []).map((e) => ({
    ...e,
    expand: e.expand ?? (e.orgName ? { org: { id: String(e.org || ''), name: e.orgName } } : undefined),
  }));
}

export type OrderFlowStatus =
  | 'pending_payment'
  | 'outdoor_pending'
  | 'pending_accept'
  | 'pending_service'
  | 'in_service'
  | 'pending_confirm'
  | 'completed'
  | 'cancelled';

export interface TimelineStep {
  key: string;
  label: string;
}

const BASE_STEPS: TimelineStep[] = [
  { key: 'pending_payment', label: '待支付' },
  { key: 'pending_accept', label: '待接单' },
  { key: 'pending_service', label: '待服务' },
  { key: 'in_service', label: '服务中' },
  { key: 'pending_confirm', label: '待确认' },
  { key: 'completed', label: '已完成' },
];

const OUTDOOR_STEPS: TimelineStep[] = [
  { key: 'pending_payment', label: '待支付' },
  { key: 'outdoor_pending', label: '外出审批' },
  { key: 'pending_accept', label: '待接单' },
  { key: 'pending_service', label: '待服务' },
  { key: 'in_service', label: '服务中' },
  { key: 'pending_confirm', label: '待确认' },
  { key: 'completed', label: '已完成' },
];

const STATUS_INDEX: Record<string, number> = {
  pending_payment: 0,
  outdoor_pending: 1,
  pending_accept: 1,
  pending_service: 2,
  in_service: 3,
  pending_confirm: 4,
  completed: 5,
};

const OUTDOOR_STATUS_INDEX: Record<string, number> = {
  pending_payment: 0,
  outdoor_pending: 1,
  pending_accept: 2,
  pending_service: 3,
  in_service: 4,
  pending_confirm: 5,
  completed: 6,
};

export function orderTimelineSteps(requiresOutdoor?: boolean): TimelineStep[] {
  return requiresOutdoor ? OUTDOOR_STEPS : BASE_STEPS;
}

export function orderTimelineIndex(status: string, requiresOutdoor?: boolean): number {
  if (status === 'cancelled') return -1;
  const map = requiresOutdoor ? OUTDOOR_STATUS_INDEX : STATUS_INDEX;
  return map[status] ?? 0;
}

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: '待支付',
    outdoor_pending: '外出待批',
    pending_accept: '待接单',
    pending_service: '待服务',
    in_service: '服务中',
    pending_confirm: '待家属/老人确认',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labels[status] || status;
}

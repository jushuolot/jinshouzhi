/** 订单节点追踪（快递式） */

export interface OrderTimelineEvent {
  key: string;
  at: string;
  detail: string;
  actor?: string;
}

export const TIMELINE_LABELS: Record<string, string> = {
  created: '订单创建',
  pending_payment: '待支付',
  outdoor_pending: '外出审批',
  pending_accept: '待接单',
  pending_service: '待服务',
  in_service: '服务中',
  pending_confirm: '待确认',
  completed: '已完成',
  cancelled: '已取消',
};

export const TIMELINE_DEFAULT_DETAIL: Record<string, string> = {
  created: '预约已提交',
  pending_payment: '等待家属/老人支付',
  outdoor_pending: '外出陪同需家属审批',
  pending_accept: '等待同学接单',
  pending_service: '同学已接单，等待到场服务',
  in_service: '同学已开始服务',
  pending_confirm: '服务已结束，等待确认',
  completed: '订单已完成',
  cancelled: '订单已取消',
};

export function formatTimelineTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 将节点事件与流程步骤合并，供纵向追踪 UI 使用 */
export function mergeTimelineForDisplay(
  stepKeys: string[],
  events: OrderTimelineEvent[],
  currentStatus: string,
): Array<{
  key: string;
  label: string;
  at?: string;
  detail?: string;
  reached: boolean;
  active: boolean;
}> {
  const byKey = new Map<string, OrderTimelineEvent>();
  for (const ev of events) {
    if (!byKey.has(ev.key)) byKey.set(ev.key, ev);
  }
  const currentIdx = stepKeys.indexOf(currentStatus);
  return stepKeys.map((key, idx) => {
    const ev = byKey.get(key);
    const reached = currentStatus === 'cancelled' ? !!ev : idx <= currentIdx;
    return {
      key,
      label: TIMELINE_LABELS[key] || key,
      at: ev?.at,
      detail: ev?.detail || (reached ? TIMELINE_DEFAULT_DETAIL[key] : undefined),
      reached,
      active: key === currentStatus && currentStatus !== 'cancelled',
    };
  });
}

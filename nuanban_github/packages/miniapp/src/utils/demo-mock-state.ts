/** 测试版 Mock 运行时状态持久化（订单等与储值卡一致，刷新不丢） */

import type { ActivityEvent } from './demo-activity';
import type { RichOrder, RichServiceLog, SettlementRecord } from './demo-rich-data';

export const DEMO_STATE_VERSION = 4;
const STORAGE_KEY = 'nuanban_demo_state_v4';

export interface MockSosAlert {
  id: string;
  elder: string;
  message: string;
  status: 'active' | 'acknowledged';
  created_at: string;
}

export interface MockOutdoorApproval {
  id: string;
  order: string;
  status: string;
  family_user: string;
}

export interface DemoRuntimeState {
  orders: RichOrder[];
  settlements: SettlementRecord[];
  serviceLogs: RichServiceLog[];
  sosAlerts: MockSosAlert[];
  outdoorApprovals: MockOutdoorApproval[];
  activityEvents: ActivityEvent[];
}

export function loadDemoRuntimeState(seed: DemoRuntimeState): DemoRuntimeState {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY) as (DemoRuntimeState & { version?: number }) | null;
    if (raw?.version === DEMO_STATE_VERSION && Array.isArray(raw.orders) && raw.orders.length > 0) {
      return {
        orders: raw.orders,
        settlements: raw.settlements || seed.settlements,
        serviceLogs: raw.serviceLogs || seed.serviceLogs,
        sosAlerts: raw.sosAlerts || seed.sosAlerts,
        outdoorApprovals: raw.outdoorApprovals || seed.outdoorApprovals,
        activityEvents: raw.activityEvents?.length ? raw.activityEvents : seed.activityEvents,
      };
    }
  } catch {
    /* ignore */
  }
  return seed;
}

export function saveDemoRuntimeState(state: DemoRuntimeState) {
  try {
    uni.setStorageSync(STORAGE_KEY, { ...state, version: DEMO_STATE_VERSION });
  } catch {
    /* ignore */
  }
}

export function clearDemoRuntimeState() {
  try {
    uni.removeStorageSync(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** 清除全部演示运行时 localStorage（订单、储值卡、学生提现） */
export function resetDemoRuntimeState() {
  clearDemoRuntimeState();
  try {
    uni.removeStorageSync('nuanban_wallet_v1');
    uni.removeStorageSync('nuanban_student_wallet_v1');
    uni.removeStorageSync('nuanban_scenario_v1');
  } catch {
    /* ignore */
  }
}

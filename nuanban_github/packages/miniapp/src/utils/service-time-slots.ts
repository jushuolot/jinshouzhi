/** 学生可服务时间预设（注册/审核提报时下拉多选） */
export const SERVICE_TIME_SLOTS = [
  '周一至周五 08:00–12:00',
  '周一至周五 14:00–18:00',
  '周一至周五 18:00–21:00',
  '周六 09:00–12:00',
  '周六 14:00–18:00',
  '周日 09:00–12:00',
  '周日 14:00–18:00',
  '节假日全天可服务',
] as const;

export type ServiceTimeSlot = (typeof SERVICE_TIME_SLOTS)[number];

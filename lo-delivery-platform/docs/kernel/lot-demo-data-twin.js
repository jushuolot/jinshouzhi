/**
 * v10 数字孪生种子 — 设施孪生体 · 实时态势元数据
 */
export const DEMO_SPATIAL_TWIN = [
  { id: 'bj-dc-shunyi', twinId: 'TWIN-DC-SY-01', sensors: ['temp', 'humidity', 'dock_queue'], live: true },
  { id: 'bj-west-hub', twinId: 'TWIN-HUB-WEST', sensors: ['yard_fill', 'gate_wait'], live: true },
  { id: 'sz-yantian-port', twinId: 'TWIN-PORT-YANTIAN', sensors: ['berth', 'container_stack'], live: true },
  { id: 'eu-rotterdam-port', twinId: 'TWIN-PORT-RTM', sensors: ['berth', 'customs_queue'], live: true },
];

export const DEMO_TWIN_SNAPSHOTS = {
  'TWIN-DC-SY-01': { tempC: 22.4, humidity: 48, dockQueue: 3, updatedAt: '2026-06-09T08:00:00Z' },
  'TWIN-PORT-YANTIAN': { berth: 'B12', containers: 8420, updatedAt: '2026-06-09T08:00:00Z' },
  'TWIN-PORT-RTM': { berth: 'RWG-7', customsQueue: 12, updatedAt: '2026-06-09T08:00:00Z' },
};

export const DEMO_TWIN_POLICIES = [
  { id: 'POL-SLA-OTIF', labelZh: 'OTIF ≥ 95%', target: 95, metric: 'otif' },
  { id: 'POL-CARBON-CAP', labelZh: '单票碳排上限 500kg', target: 500, metric: 'carbon_per_order' },
  { id: 'POL-COLD-TEMP', labelZh: '冷链 2-8°C', target: 8, metric: 'cold_temp_max' },
];

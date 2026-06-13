-- Demo seed aligned with web/index.html (ORDER_CHAIN_STAGES, ECOSYSTEM, los[])
-- Run after schema.sql: sqlite3 your.db < db/seed.sql

BEGIN;

DELETE FROM order_events;
DELETE FROM lo_orders;
DELETE FROM chain_stage_definitions;
DELETE FROM ecosystem_roles;
DELETE FROM daily_goal_templates;
DELETE FROM sim_econ_state;

INSERT INTO ecosystem_roles (id, name, short, hint, color_1, color_2) VALUES
  ('shipper', '货主', 'SHIP', '委托、费用确认、投诉升级与最终结算态度。', '#8eb8c8', '#4a7a8a'),
  ('sales', '销售', 'SALES', '签约条款、SLA 谈判、客户预期管理。', '#d4a8c4', '#9a6088'),
  ('purchase', '采购', 'PROC', '货源与批次、供应商交期、成本结构。', '#a8c8a0', '#5a8a68'),
  ('warehouse', '库管', 'WH', '拣复核、装车、库存账实一致。', '#d8c898', '#9a8860'),
  ('dispatch', '调度', 'DSP', '配载、改派、异常升级与资源博弈。', '#9eb0d0', '#5a7090'),
  ('carrier', '承运商', 'CARR', '合同运力、干线节点、对账条款。', '#b0b0d8', '#7070a8'),
  ('driver', '司机', 'DRV', '末端执行、App 回单、客户沟通一线。', '#d8c8a8', '#988860'),
  ('consignee', '收货人', 'RCV', '签收、拒收、改约与现场异常。', '#98d8c8', '#509888'),
  ('finance', '财务', 'FIN', '对账、开票、核销与自动规则。', '#e0d898', '#a8a060'),
  ('qc', '质控', 'QC', '回单/OCR/轨迹证据校验、异常判责抽样、SLA 合规闸口。', '#88d0e0', '#4898b0'),
  ('cs', '客服', 'CS', '末端改约、签收与对账争议调解、客户安抚与工单闭环。', '#d8b8d8', '#a078a0');

INSERT INTO chain_stage_definitions (sort_order, code, label, role_key, role_label, gate, checklist_json, secondary_role_keys_json) VALUES
  (0, 'S01', '销售签约', 'sales', '销售', '商机/合同/客户组/价格与 SLA 条款锁定，生成可执行 LO。',
   '["LO 主数据与收货人地址清洗通过","时效产品与赔付策略绑定到客户组"]', NULL),
  (1, 'S02', '采购备货', 'purchase', '采购', '货源、批次、效期与采购/调拨单对齐，可下发仓库。',
   '["供应商交期写入可执行日历","批次与溯源码（若有）预分配"]', NULL),
  (2, 'S03', '调度配载', 'dispatch', '调度', '线路、车型、承运资源与时段窗确认，形成运输执行计划。',
   '["承运合同与油价条款快照","干线与城配衔接班次落表"]', NULL),
  (3, 'S04', '库管出库', 'warehouse', '库管', '拣货、复核、装车交接完成，状态回写 LO。',
   '["称重/体积影像上传","装载清单与封签号绑定"]', NULL),
  (4, 'S05', '承运接单', 'carrier', '承运商', '运力确认、单证齐全、责权与保险边界切割。',
   '["电子运单与在途联系人名单","司机端任务包下发"]', NULL),
  (5, 'S06', '干线在途', 'carrier', '承运商', '节点到离、轨迹与在途异常闭环，支撑对账证据。',
   '["GPS / 电子围栏心跳","路桥油气费票据采集策略"]', NULL),
  (6, 'S07', '末端派送', 'driver', '司机', '到站、联系收货人、派送执行与异常纪实；异常时客服同步对外口径与改约。',
   '["到货通知与改约规则","签收方式（本人/代收/柜）","客服：首次失败 / 无人接听 / 地址争议 → 工单升级与预约重派"]', '["cs"]'),
  (7, 'S08', '收货签收', 'consignee', '收货人', '签收事实成立；货损/短少当场确认或拒收路径；争议由客服居中取证与冻结计费边界。',
   '["签收人身份与时段记录","现场照片/签字证据","客服：代收人核验存疑 / 破损争议 → 三方沟通与理赔单号"]', '["cs"]'),
  (8, 'S09', '回单·质检与结算', 'finance', '财务·对账', '质控完成回单与轨迹证据闸口后，财务生成对账包；客服收口对账争议与客户账期沟通。',
   '["质控：OCR / 盖章规则 / 轨迹三件套抽检与退回补证","质控：VIP 章规、电子围栏与等时费证据链一致性","财务：应收应付清分、调账流程与开票触发","客服：对账差异解释、客户确认催办与升级路径登记"]', '["qc","cs"]'),
  (9, 'S10', '货主确认', 'shipper', '货主', '费用争议关闭或进入仲裁；开放门户/EDI 回执。',
   '["portal / EDI 对账回执","逾期自动确认策略（若约定）"]', NULL);

INSERT INTO lo_orders (
  id, channel, status, risk, priority, demand, sat, next_text, eta_text, level,
  chain_lane, chain_current, chain_blocked, bars_json, chain_notes_json, side_json
) VALUES
  (
    'LO-2026-000801',
    'ecom',
    '运输中',
    'yellow',
    'P2',
    72,
    81,
    '补采签收定位证据（否则无法通关结算）',
    '承诺窗口：今日 18:30 关闭',
    'TIER-B',
    '货主 RDC(嘉兴) → 华东 DC 复核出库 → 沪宁干线(B 合约) → 闵行 HUB → 司机 U204 → B2C 买家',
    6,
    NULL,
    '{"sla":62,"proof":48,"recon":35}',
    '{"6":["围栏证据未触发：需补采签收定位或末端拍照复核","客服已建 P2 工单并行催司机回传","质控：末端 GPS/拍照缺口记入证据评分，未补全前 S09 自动对账包不予放行"]}',
    '["[LINE] 干线运力占用 68%","[LAST MILE] 末端司机 #U204","[RISK] 证据缺口 → 声望 -2（若超时）","[PAY] 预估应收 ¥128（签收后锁定）"]'
  ),
  (
    'LO-2026-000802',
    'b2b',
    '待回单质检',
    'green',
    'P1',
    55,
    92,
    'OCR + 盖章规则校验（客户 SLA）',
    '承诺窗口：明日 09:00',
    'TIER-A',
    'B2B 工厂直发 → 承运商契约线路 → 园区门卫代收 → 对账周期 D+3',
    8,
    NULL,
    '{"sla":91,"proof":88,"recon":72}',
    '{"8":["质控：OCR 等待客户章规强校验（VIP-A）","客服：已向客户同步「章规不符」口径与补扫截止时间","财务：自动对账包已排队，待质控放行信号"]}',
    '["[QC] stamp_present = true","[AUTO] 对账包预生成中","[REP] 高价值客户，优先队列"]'
  ),
  (
    'LO-2026-000803',
    'store',
    '异常处理',
    'red',
    'P0',
    91,
    64,
    '判责 + 改约 / 改派（二选一）',
    '警报：已超时 42m',
    'TIER-S',
    '门店前置仓 → 同城众包 → 居住区预约窗派送',
    6,
    6,
    '{"sla":28,"proof":66,"recon":50}',
    '{"6":["首次派送失败：收货人电话无人接听","客服：已外呼 2 次并短信预约窗，待收货人确认改约或门卫代收","调度二派与改约两条分支待决策","质控：若进入拒收/货损路径需留存通话与现场照片编号"]}',
    '["[CITY] 门店客流高峰 → 建议改约","[OPS] 备用承运商 B 空闲 22%","[COST] 二派预估 +¥46"]'
  );

INSERT INTO order_events (lo_id, seq, time_label, event_code, category) VALUES
  ('LO-2026-000801', 0, '10:02', 'LO_CREATED', 'FACT'),
  ('LO-2026-000801', 1, '10:05', 'DECISION_POLICY_RESOLVED', 'DECISION'),
  ('LO-2026-000801', 2, '10:40', 'PICK_COMPLETED', 'FACT'),
  ('LO-2026-000801', 3, '11:12', 'WEIGHED_MEASURED', 'FACT'),
  ('LO-2026-000801', 4, '11:45', 'LOADED', 'FACT'),
  ('LO-2026-000801', 5, '12:08', 'CARRIER_ACCEPTED', 'FACT'),
  ('LO-2026-000801', 6, '12:30', 'DEPARTED', 'FACT'),
  ('LO-2026-000801', 7, '14:10', 'OUT_FOR_DELIVERY', 'FACT'),
  ('LO-2026-000802', 0, '09:10', 'LO_CREATED', 'FACT'),
  ('LO-2026-000802', 1, '15:20', 'SIGNED', 'FACT'),
  ('LO-2026-000802', 2, '15:35', 'POD_UPLOADED', 'FACT'),
  ('LO-2026-000802', 3, '15:42', 'OCR_EXTRACTED', 'FACT'),
  ('LO-2026-000803', 0, '08:00', 'LO_CREATED', 'FACT'),
  ('LO-2026-000803', 1, '16:10', 'DELIVERY_ATTEMPTED', 'FACT'),
  ('LO-2026-000803', 2, '16:18', 'EXCEPTION_REPORTED', 'EXCEPTION'),
  ('LO-2026-000803', 3, '16:22', 'DECISION_REPLAN', 'DECISION');

INSERT INTO daily_goal_templates (sort_order, meta, title, max_progress, sub) VALUES
  (0, 'DAILY 1 / 3', '处理突发运营事件', 2, '在弹窗中做出经营抉择即计数'),
  (1, 'DAILY 2 / 3', '催补关键证据', 3, '点击「催补证据」或按 E'),
  (2, 'DAILY 3 / 3', '广播协同', 1, '点击「广播通知」');

INSERT INTO sim_econ_state (id, cash_yuan, rep, morale, queue, autorecon_pct, sim_day, sim_minutes) VALUES
  (1, 2840200, 82, 76, 14, 78, 142, 872);

COMMIT;

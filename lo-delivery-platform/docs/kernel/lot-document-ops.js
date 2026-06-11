/**
 * 单据作业 — 状态流转 · 角色闸门 · 作业按钮
 */
import { DOC_TYPES } from './lot-documents.js';
import { ACTOR_LENSES } from './lot-nucleus.js';

const STATUS_RANK = { draft: 0, approved: 1, posted: 2, void: 99 };

export const DOC_WORKFLOW = {
  SO: {
    draft: [{ id: 'approve', label: '提交审单', actor: 'shipper', nextStatus: 'approved' }],
    approved: [{ id: 'post', label: '正式过账', actor: 'shipper', nextStatus: 'posted' }],
    posted: [],
  },
  PR: {
    draft: [{ id: 'post', label: '下达采购申请', actor: 'planner', nextStatus: 'posted' }],
    posted: [],
  },
  CO: {
    draft: [{ id: 'post', label: '确认链订单', actor: 'shipper', nextStatus: 'posted' }],
    posted: [],
  },
  PO: {
    draft: [{ id: 'issue', label: '下达采购单', actor: 'purchaser', nextStatus: 'posted' }],
    posted: [],
  },
  WB: {
    draft: [{ id: 'post', label: '签发运单', actor: 'dispatcher', nextStatus: 'posted' }],
    posted: [],
  },
};

export function actorLabel(actor) {
  return ACTOR_LENSES[actor]?.labelZh || actor;
}

export function docStatusRank(status) {
  return STATUS_RANK[status] ?? 0;
}

export function getDocumentActions(doc, viewerActor) {
  if (!doc) return [];
  const flows = DOC_WORKFLOW[doc.docType] || {};
  const actions = flows[doc.status] || [];
  return actions.map((a) => ({
    ...a,
    actorLabel: actorLabel(a.actor),
    canExecute: viewerActor === a.actor,
    blockedReason: viewerActor !== a.actor ? `需「${actorLabel(a.actor)}」操作` : null,
  }));
}

export async function applyDocumentAction(chain, docId, actionId, viewerActor) {
  const doc = await chain.getDocument(docId);
  if (!doc) return { ok: false, reason: '单据不存在' };
  const actions = getDocumentActions(doc, viewerActor);
  const act = actions.find((a) => a.id === actionId);
  if (!act) return { ok: false, reason: '无效操作' };
  if (!act.canExecute) return { ok: false, reason: act.blockedReason };
  doc.status = act.nextStatus;
  doc.header = { ...doc.header, updatedAt: new Date().toISOString(), lastAction: actionId, lastActor: viewerActor };
  await chain.local.putDocument(doc);
  return { ok: true, doc, action: act };
}

function docIdForGate(chainOrderId, type) {
  const suffix = chainOrderId.replace('CO-', '');
  return type === 'SO' ? `DOC-SO-${suffix}` : `DOC-${type}-${suffix}`;
}

async function checkOneDocGate(chain, chainOrderId, { type, status }) {
  const docId = docIdForGate(chainOrderId, type);
  const doc = await chain.getDocument(docId);
  if (!doc) {
    return { ok: false, reason: `请先在单据作业台处理 ${type}（尚未生成）` };
  }
  if (docStatusRank(doc.status) < docStatusRank(status)) {
    const need = { draft: '草拟', approved: '审单通过', posted: '过账' }[status] || status;
    const act = DOC_WORKFLOW[type]?.[doc.status]?.[0];
    const hint = act ? ` · 请点击「${act.label}」` : '';
    return { ok: false, reason: `${type} 须先「${need}」${hint}（当前：${doc.status}）` };
  }
  return { ok: true, doc };
}

/** 销售流程步进前的单据闸门（支持多单据） */
export async function checkShipperDocGate(chain, chainOrderId, step) {
  if (!step?.docGate) return { ok: true };
  const gates = Array.isArray(step.docGate) ? step.docGate : [step.docGate];
  for (const g of gates) {
    const r = await checkOneDocGate(chain, chainOrderId, g);
    if (!r.ok) return r;
  }
  return { ok: true };
}

export function renderDocWorkbenchHtml(doc, actions, viewerActor) {
  if (!doc) return '<p class="lo-meta">选择单据</p>';
  const meta = DOC_TYPES[doc.docType] || { labelZh: doc.docType, icon: '📄' };
  const lines = (doc.lines || [])
    .map(
      (l) =>
        `<tr><td>${l.sku || ''}</td><td>${l.name}</td><td>${l.qty}${l.uom || ''}</td>` +
        `<td>¥${(l.amount ?? l.qty * l.price).toFixed(0)}</td></tr>`
    )
    .join('');
  const btns = actions
    .map(
      (a) =>
        `<button type="button" class="doc-act${a.canExecute ? '' : ' off'}" data-doc-act="${a.id}" ` +
        `${a.canExecute ? '' : 'disabled title="' + a.blockedReason + '"'}>${a.label}</button>`
    )
    .join('');
  return (
    `<div class="doc-card">` +
    `<div class="doc-card-head">${meta.icon} <b>${doc.header?.docNo || doc.docId}</b> ` +
    `<span class="badge">${meta.labelZh} · ${doc.status}</span></div>` +
    `<div class="lo-meta">${doc.header?.title || ''}</div>` +
    `<div class="lo-meta">${doc.header?.partyFrom || ''} → ${doc.header?.partyTo || ''} · ¥${doc.header?.amount || 0}</div>` +
    (lines
      ? `<table class="doc-table"><thead><tr><th>SKU</th><th>品名</th><th>数量</th><th>金额</th></tr></thead><tbody>${lines}</tbody></table>`
      : '') +
    `<div class="doc-actions">${btns || '<span class="lo-meta">已过账 / 无可用操作</span>'}</div>` +
    `<div class="lo-meta">当前镜头：${actorLabel(viewerActor)}</div></div>`
  );
}

/**
 * 人工作业台 UI — 待办操作 · 单据作业 · 流程步进（禁止静默自动推进）
 */
import { ACTOR_LENSES } from '../kernel/lot-nucleus.js';
import {
  getDocumentActions,
  renderDocWorkbenchHtml,
  actorLabel,
} from '../kernel/lot-document-ops.js?v=13.1.0';

let ctx = null;

function $(id) {
  return document.getElementById(id);
}

export async function renderOperationConsole(chain, chainOrderId, viewerActor, containers = {}, options = {}) {
  const c4iMode = options.c4iMode !== false;
  const opsEl = containers.ops || $('ops-console');
  const docsEl = containers.docs || $('doc-workbench');
  const flowEl = containers.flow || $('sales-flow');
  if (!opsEl) return;

  if (!chainOrderId) {
    opsEl.innerHTML = '<p class="lo-meta">选择链订单后显示待办操作</p>';
    if (docsEl) docsEl.innerHTML = '';
    if (flowEl) flowEl.innerHTML = '';
    return;
  }

  const pending = await chain.getPendingOperation(chainOrderId, viewerActor);
  const autoPilot = await chain.getAutoPilot();

  if (pending?.flowSteps || pending?.phase === 'sales_flow') {
    const flow = await chain.getShipperFlow(chainOrderId);
    if (flowEl && flow) {
      flowEl.innerHTML =
        `<p class="sec-title">货主下单流程（须人工逐步确认）</p>` +
        flow.steps
          .map((s) => {
            const cls = s.done ? 'done' : s.current ? 'current' : '';
            const who = ACTOR_LENSES[s.actor]?.labelZh || s.actor;
            return `<div class="flow-step ${cls}"><span>${s.done ? '✓' : s.current ? '▶' : '○'}</span> ${s.labelZh} <span class="lo-meta">@${who}</span></div>`;
          })
          .join('');
    }
  } else if (flowEl) {
    const co = await chain.getChainOrder(chainOrderId);
    if (co?.salesFlowComplete) {
      flowEl.innerHTML = '<p class="lo-meta" style="color:var(--accent)">销售流程已完成 · 请在下方执行履约操作</p>';
    } else {
      flowEl.innerHTML = '';
    }
  }

  if (!pending || pending.done) {
    opsEl.innerHTML =
      `<div class="ops-card done"><p class="sec-title" style="margin:0">作业台</p>` +
      `<p class="lo-meta">${pending?.labelZh || '当前无销售侧待办 · 可在角色镜头执行履约动作'}</p></div>`;
  } else {
    const disabled = pending.canExecute ? '' : 'disabled';
    const warn = pending.blockedReason
      ? `<p class="ops-warn">${pending.blockedReason}</p>`
      : '';
    const leg = pending.legLabel ? `<span class="lo-meta">${pending.legLabel}</span>` : '';
    const fieldRole = pending.actor || viewerActor;
    const fieldUrl = `field/role.html?role=${fieldRole}&co=${encodeURIComponent(chainOrderId)}`;
    const execBtn = c4iMode
      ? `<a class="ops-primary ops-link" href="${fieldUrl}">📱 Field · ${pending.buttonLabel}</a>` +
        `<p class="lo-meta" style="margin-top:6px">C4I 只读态势 · 执行请用手机现场</p>`
      : `<button type="button" id="btn-exec-op" class="ops-primary" ${disabled}>${pending.buttonLabel}</button>`;

    opsEl.innerHTML =
      `<div class="ops-card ops-readonly">` +
      `<p class="sec-title" style="margin:0">待办态势 · ${pending.phase === 'sales_flow' ? '销售下单' : pending.phase === 'exception' ? '异常闭环' : '履约作业'}</p>` +
      `<div class="ops-actor">须由：<b>${pending.actorLabel}</b> · 镜头 ${actorLabel(viewerActor)}</div>` +
      leg +
      warn +
      execBtn +
      `</div>`;

    const btn = $('btn-exec-op');
    if (btn && pending.canExecute && !c4iMode) {
      btn.onclick = async () => {
        const r = await chain.executeOperation(chainOrderId, viewerActor);
        if (!r.ok) {
          if (ctx?.logEvolve) ctx.logEvolve(`<b>受阻</b> ${r.reason}`);
          return;
        }
        if (r.step?.loId) ctx.state.activeLoId = r.step.loId;
        if (ctx?.logEvolve) {
          ctx.logEvolve(`<b>人工确认</b> ${pending.buttonLabel} · @${viewerActor}`);
        }
        await ctx.onRefresh();
      };
    }
  }

  if (autoPilot) {
    opsEl.innerHTML += '<p class="ops-warn" style="margin-top:6px">⚠ 演示自动驾驶已开启（将自动推步，非生产模式）</p>';
  }

  await renderDocumentWorkbench(chain, chainOrderId, viewerActor, docsEl);
}

export async function renderDocumentWorkbench(chain, chainOrderId, viewerActor, el) {
  if (!el) return;
  const docs = await chain.getDocumentsForChain(chainOrderId);
  if (!docs.length) {
    el.innerHTML = '<p class="sec-title">单据作业台</p><p class="lo-meta">暂无单据 · 完成「草拟销售订单」后生成 SO</p>';
    return;
  }

  const activeId = el.dataset.activeDoc || docs[0].docId;
  const doc = docs.find((d) => d.docId === activeId) || docs[0];
  const actions = await chain.getDocumentActions(doc.docId, viewerActor);

  el.innerHTML =
    `<p class="sec-title">单据作业台</p>` +
    `<div class="doc-chips">${docs
      .map(
        (d) =>
          `<button type="button" class="doc-chip${d.docId === doc.docId ? ' on' : ''}" data-pick-doc="${d.docId}">${d.docType} · ${d.status}</button>`
      )
      .join('')}</div>` +
    renderDocWorkbenchHtml(doc, actions, viewerActor);

  el.dataset.activeDoc = doc.docId;
  el.querySelectorAll('[data-pick-doc]').forEach((b) => {
    b.onclick = async () => {
      el.dataset.activeDoc = b.dataset.pickDoc;
      await renderDocumentWorkbench(chain, chainOrderId, viewerActor, el);
    };
  });
  el.querySelectorAll('[data-doc-act]').forEach((b) => {
    b.onclick = async () => {
      const r = await chain.applyDocumentAction(doc.docId, b.dataset.docAct, viewerActor);
      if (!r.ok) {
        if (ctx?.logEvolve) ctx.logEvolve(`<b>单据</b> ${r.reason}`);
        return;
      }
      if (ctx?.logEvolve) ctx.logEvolve(`<b>单据</b> ${doc.docType} → ${r.doc.status}`);
      await ctx.onRefresh();
    };
  });
}

export function bindOperationConsole({ state, chain, onRefresh, logEvolve }) {
  ctx = { state, chain, onRefresh, logEvolve };
}

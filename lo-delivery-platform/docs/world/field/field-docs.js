/**
 * Field 内嵌单据 — 手机端不跳转 C4I
 */
import { getDocumentActions, renderDocWorkbenchHtml } from '../../kernel/lot-document-ops.js?v=13.1';

export async function renderFieldDocs(chain, chainOrderId, role, el, { onAction } = {}) {
  if (!el) return;
  const docs = await chain.getDocumentsForChain(chainOrderId);
  if (!docs.length) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  const activeId = el.dataset.activeDoc || docs[0].docId;
  const doc = docs.find((d) => d.docId === activeId) || docs[0];
  const actions = await chain.getDocumentActions(doc.docId, role);
  const hasMine = actions.some((a) => a.canExecute);

  el.innerHTML =
    `<p class="doc-sec">单据 · ${hasMine ? '可操作' : '只读'}</p>` +
    `<div class="doc-chips">${docs
      .map(
        (d) =>
          `<button type="button" class="doc-chip${d.docId === doc.docId ? ' on' : ''}" data-pick="${d.docId}">${d.docType}·${d.status}</button>`
      )
      .join('')}</div>` +
    renderDocWorkbenchHtml(doc, actions, role);

  el.dataset.activeDoc = doc.docId;
  el.querySelectorAll('[data-pick]').forEach((b) => {
    b.onclick = async () => {
      el.dataset.activeDoc = b.dataset.pick;
      await renderFieldDocs(chain, chainOrderId, role, el, { onAction });
    };
  });
  el.querySelectorAll('[data-doc-act]').forEach((b) => {
    b.onclick = async () => {
      const r = await chain.applyDocumentAction(doc.docId, b.dataset.docAct, role);
      if (onAction) onAction(r);
    };
  });
}

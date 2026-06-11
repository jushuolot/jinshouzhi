/**
 * Field 现场壳 — 全角色统一移动作业（司机端范式）
 */
import { ACTOR_LENSES } from '../../kernel/lot-nucleus.js';
import { actorLabel } from '../../kernel/lot-document-ops.js?v=13';

const $ = (id) => document.getElementById(id);

export function parseRole() {
  const q = new URLSearchParams(location.search);
  return q.get('role') || localStorage.getItem('lot_field_role') || 'driver';
}

export function bindFieldShell({ chain, role, onReady }) {
  localStorage.setItem('lot_field_role', role);
  const lens = ACTOR_LENSES[role] || { labelZh: role };
  $('role-title').textContent = lens.labelZh + ' · 现场';
  $('role-badge').textContent = role;

  async function refresh() {
    await chain.init();
    const orders = await chain.listChainOrders();
    const tasks = [];

    for (const co of orders) {
      if (co.status === 'settled') continue;
      const pending = await chain.getPendingOperation(co.chainOrderId, role);
      if (!pending || pending.done) continue;
      tasks.push({ co, pending });
    }

    tasks.sort((a, b) => {
      const pa = a.pending.canExecute ? 0 : 1;
      const pb = b.pending.canExecute ? 0 : 1;
      return pa - pb;
    });

    $('task-count').textContent = `${tasks.length} 待办`;
    const list = $('task-list');
    if (!tasks.length) {
      list.innerHTML = '';
      $('empty').hidden = false;
      $('actions').hidden = true;
      return;
    }
    $('empty').hidden = true;

    let active = tasks.find((t) => t.pending.canExecute) || tasks[0];
    list.innerHTML = tasks
      .map(({ co, pending }) => {
        const on = co.chainOrderId === active.co.chainOrderId ? ' active' : '';
        return (
          `<div class="task${on}" data-co="${co.chainOrderId}">` +
          `<div class="task-id">${co.chainOrderId}</div>` +
          `<div class="task-route">${co.title}</div>` +
          `<div class="task-meta">${pending.buttonLabel} · @${pending.actorLabel}</div>` +
          (pending.blockedReason ? `<div class="task-warn">${pending.blockedReason}</div>` : '') +
          `</div>`
        );
      })
      .join('');

    list.querySelectorAll('.task').forEach((el) => {
      el.onclick = () => {
        active = tasks.find((t) => t.co.chainOrderId === el.dataset.co);
        refresh();
      };
    });

    const btn = $('btn-exec');
    btn.textContent = active.pending.buttonLabel;
    btn.disabled = !active.pending.canExecute;
    btn.onclick = async () => {
      const r = await chain.executeOperation(active.co.chainOrderId, role);
      toast(r.ok ? `已确认：${active.pending.buttonLabel}` : r.reason || '操作受阻');
      await refresh();
    };

    const docBtn = $('btn-docs');
    if (docBtn) {
      const docs = await chain.getDocumentsForChain(active.co.chainOrderId);
      docBtn.hidden = !docs.length;
      docBtn.onclick = () => {
        location.href = `../index.html?co=${active.co.chainOrderId}&actor=${role}#doc-workbench`;
      };
    }

    $('actions').hidden = false;
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  }

  refresh();
  if (onReady) onReady(refresh);
  return { refresh, toast };
}

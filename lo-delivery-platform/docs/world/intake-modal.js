import {
  CSV_TEMPLATE,
  parseCsvImport,
  parseJsonImport,
  fetchSalesOrderApi,
  intakeSourceLabel,
  summarizeIntake,
} from '../kernel/lot-sales-intake.js?v=12.0';

let ctx = null;

function $(id) {
  return document.getElementById(id);
}

export function openOrderModal() {
  const modal = $('order-modal');
  if (!modal) return;
  modal.hidden = false;
  modal.style.display = 'flex';
  switchTab('manual');
}

export function closeOrderModal() {
  const modal = $('order-modal');
  if (!modal) return;
  modal.hidden = true;
  modal.style.display = 'none';
}

function switchTab(tab) {
  document.querySelectorAll('[data-intake-tab]').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.intakeTab === tab);
  });
  document.querySelectorAll('[data-intake-panel]').forEach((p) => {
    p.hidden = p.dataset.intakePanel !== tab;
  });
}

function readManualForm() {
  const lines = [];
  document.querySelectorAll('#manual-lines tr[data-line]').forEach((row, i) => {
    const g = (n) => row.querySelector(`[name="${n}"]`)?.value;
    const qty = Number(g('qty')) || 0;
    const price = Number(g('price')) || 0;
    if (!g('name')) return;
    lines.push({
      lineNo: i + 1,
      sku: g('sku') || `SKU-${i + 1}`,
      name: g('name'),
      spec: g('spec') || '',
      qty,
      uom: g('uom') || '件',
      price,
      amount: qty * price,
    });
  });
  return {
    source: 'manual',
    anchorEnterpriseId: ctx.state.viewerEnterpriseId,
    title: $('in-title')?.value || '链订单',
    cargoSummary: $('in-cargo')?.value || lines[0]?.name || '供应链货品',
    consignee: $('in-consignee')?.value || '终端客户',
    customerRef: $('in-so')?.value || undefined,
    orderLines: lines,
  };
}

function addManualLine(prefill = {}) {
  const tbody = $('manual-lines');
  if (!tbody) return;
  const i = tbody.querySelectorAll('tr[data-line]').length;
  const tr = document.createElement('tr');
  tr.dataset.line = '1';
  tr.innerHTML = `
    <td><input name="sku" value="${prefill.sku || ''}" placeholder="SKU" /></td>
    <td><input name="name" value="${prefill.name || ''}" placeholder="品名" /></td>
    <td><input name="spec" value="${prefill.spec || ''}" placeholder="规格" /></td>
    <td><input name="qty" type="number" value="${prefill.qty ?? 1}" /></td>
    <td><input name="uom" value="${prefill.uom || '件'}" /></td>
    <td><input name="price" type="number" value="${prefill.price ?? 0}" /></td>
    <td><button type="button" class="rm-line">×</button></td>`;
  tbody.appendChild(tr);
  tr.querySelector('.rm-line').onclick = () => tr.remove();
}

async function submitIntake(intake) {
  const r = await ctx.chain.createChainFromIntake(intake);
  ctx.state.activeCoId = r.chainOrder.chainOrderId;
  ctx.state.activeLoId = r.salesLoId;
  ctx.state.actor = 'shipper';
  closeOrderModal();
  await ctx.onRefresh();
  if (ctx.logEvolve) {
    const s = summarizeIntake(intake);
    ctx.logEvolve(`<b>货主下单</b> ${s.title} · ¥${s.amount.toFixed(0)} · 请在作业台由货主点击「草拟销售订单」`);
  }
  renderSalesFlow(ctx.chain, r.chainOrder.chainOrderId, $('sales-flow'));
  renderDocs(ctx.chain, r.chainOrder.chainOrderId, $('doc-panel'), $('doc-detail'));
}

/** 流程/单据渲染已迁移至 operation-console.js */
export async function renderSalesFlow() {}
export async function renderDocs() {}

export function bindOrderIntake({ state, chain, onRefresh, logEvolve }) {
  ctx = { state, chain, onRefresh, logEvolve };

  $('btn-new')?.addEventListener('click', (e) => {
    e.preventDefault();
    openOrderModal();
  });
  $('order-modal-close')?.addEventListener('click', closeOrderModal);
  $('order-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'order-modal') closeOrderModal();
  });

  document.querySelectorAll('[data-intake-tab]').forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.intakeTab);
  });

  $('btn-add-line')?.addEventListener('click', () => addManualLine());
  if ($('manual-lines') && !$('manual-lines').querySelector('tr[data-line]')) {
    addManualLine({ name: '智能终端整机', sku: 'SKU-MAIN-01', qty: 100, price: 1280 });
  }

  $('btn-manual-submit')?.addEventListener('click', async () => {
    await submitIntake(readManualForm());
  });

  $('btn-csv-template')?.addEventListener('click', () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lot-sales-order-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const orders = file.name.endsWith('.json') ? parseJsonImport(text) : parseCsvImport(text);
    $('import-preview').textContent = orders.map((o) => `${o.title} · ${o.orderLines.length} 行`).join('\n');
    $('import-preview').dataset.payload = JSON.stringify(orders[0]);
  });

  $('btn-import-submit')?.addEventListener('click', async () => {
    const raw = $('import-preview')?.dataset.payload;
    if (!raw) return;
    const order = JSON.parse(raw);
    await submitIntake({ ...order, anchorEnterpriseId: state.viewerEnterpriseId });
  });

  $('btn-api-fetch')?.addEventListener('click', async () => {
    const url = $('api-url')?.value?.trim() || 'demo';
    const r = await fetchSalesOrderApi(url);
    const o = r.orders[0];
    $('api-preview').textContent = `${o.title} · ${o.orderLines.length} 行 · ${r.demo ? '演示数据' : r.fallback ? '回退演示' : '已拉取'}`;
    $('api-preview').dataset.payload = JSON.stringify(o);
  });

  $('btn-api-submit')?.addEventListener('click', async () => {
    const raw = $('api-preview')?.dataset.payload;
    if (!raw) {
      $('btn-api-fetch')?.click();
      return;
    }
    const order = JSON.parse(raw);
    await submitIntake({ ...order, anchorEnterpriseId: state.viewerEnterpriseId });
  });
}
